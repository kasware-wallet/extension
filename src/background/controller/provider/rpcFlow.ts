import { ethErrors } from 'eth-rpc-errors';
import 'reflect-metadata';

import { keyringService, notificationService, permissionService, preferenceService } from '@/background/service';
import { PromiseFlow } from '@/background/utils';
import { underline2Camelcase } from '@/shared/utils';
import { KASPA_EVENTS, kaspaChainFromNetworkId } from '@/shared/constant';
import eventBus from '@/shared/eventBus';

import providerController from './controller';

const isSignApproval = (type: string) => {
  const SIGN_APPROVALS = ['SignText', 'SignPsbt', 'SignTx', 'CommitReveal', 'KRC20Order'];
  return SIGN_APPROVALS.includes(type);
};
const windowHeight = 600;
const flow = new PromiseFlow();
const flowContext = flow
  .use(async (ctx, next) => {
    // check method
    const {
      data: { method }
    } = ctx.request;
    ctx.mapMethod = underline2Camelcase(method);

    if (!providerController[ctx.mapMethod]) {
      throw ethErrors.rpc.methodNotFound({
        message: `method [${method}] doesn't has corresponding handler`,
        data: ctx.request.data
      });
    }

    // why: nine handlers destructure `data.params` in their parameter list, so a call that sends no params
    // at all — `kasware.request('pushTx')`, or `_request` on the extension — failed as
    // `TypeError: Cannot destructure property …` instead of a named invalid-params error, and
    // `signMessage`'s own validation never got to run. One default here rather than nine signatures.
    if (ctx.request.data.params === undefined || ctx.request.data.params === null) {
      ctx.request.data.params = {};
    }

    return next();
  })
  .use(async (ctx, next) => {
    const { mapMethod } = ctx;
    if (!Reflect.getMetadata('SAFE', providerController, mapMethod)) {
      // check lock
      const isUnlock = keyringService.memStore.getState().isUnlocked;

      if (!isUnlock) {
        ctx.request.requestedApproval = true;
        await notificationService.requestApproval({ lock: true });
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    // check connect
    const {
      request: {
        session: { origin, name, icon }
      },
      mapMethod
    } = ctx;
    if (!Reflect.getMetadata('SAFE', providerController, mapMethod)) {
      if (!permissionService.hasPermission(origin)) {
        ctx.request.requestedApproval = true;
        await notificationService.requestApproval(
          {
            params: {
              method: 'connect',
              data: {},
              session: { origin, name, icon }
            },
            approvalComponent: 'Connect'
          },
          { height: windowHeight }
        );
        permissionService.addConnectedSite(
          origin,
          name,
          icon,
          kaspaChainFromNetworkId(preferenceService.getNetworkId())
        );
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    // check need approval
    const {
      request: {
        data: { params, method },
        session: { origin, name, icon }
      },
      mapMethod
    } = ctx;
    const [approvalType, condition, options = {}] =
      Reflect.getMetadata('APPROVAL', providerController, mapMethod) || [];

    if (approvalType && (!condition || !condition(ctx.request))) {
      ctx.request.requestedApproval = true;
      // Snapshot the network+account the window is about to be raised under, so `signPskt` can bind the
      // signature to what the user actually saw. If the wallet switches network or account while the
      // request is pending, the signature would otherwise be produced under a context nobody approved.
      ctx.preApprovalContext = {
        networkId: preferenceService.getNetworkId(),
        accountAddress: preferenceService.getCurrentAccount()?.address ?? ''
      };
      ctx.approvalRes = await notificationService.requestApproval(
        {
          approvalComponent: approvalType,
          params: {
            method,
            data: params,
            session: { origin, name, icon }
          },
          origin
        },
        { height: windowHeight }
      );
      if (isSignApproval(approvalType)) {
        permissionService.updateConnectSite(origin, { isSigned: true }, true);
      } else {
        permissionService.touchConnectedSite(origin);
      }
    }

    return next();
  })
  .use(async (ctx) => {
    const { approvalRes, mapMethod, request } = ctx;
    // process request
    const [approvalType] = Reflect.getMetadata('APPROVAL', providerController, mapMethod) || [];

    const { uiRequestComponent, ...rest } = approvalRes || {};
    const {
      session: { origin }
    } = request;
    const requestDefer = Promise.resolve(
      providerController[mapMethod]({
        ...request,
        approvalRes,
        // The binding snapshot captured before the approval was raised; only `signPskt` reads it.
        preApprovalContext: ctx.preApprovalContext
      })
    );

    requestDefer
      .then((result) => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(KASPA_EVENTS.broadcastToUI, {
            method: KASPA_EVENTS.SIGN_FINISHED,
            params: {
              success: true,
              data: result
            }
          });
        }
        return result;
      })
      .catch((e: any) => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(KASPA_EVENTS.broadcastToUI, {
            method: KASPA_EVENTS.SIGN_FINISHED,
            params: {
              success: false,
              errorMsg: JSON.stringify(e)
            }
          });
        }
      });
    async function requestApprovalLoop({ uiRequestComponent, ...rest }) {
      ctx.request.requestedApproval = true;
      const res = await notificationService.requestApproval({
        approvalComponent: uiRequestComponent,
        params: rest,
        origin,
        approvalType
      });
      if (res.uiRequestComponent) {
        return await requestApprovalLoop(res);
      } else {
        return res;
      }
    }
    if (uiRequestComponent) {
      ctx.request.requestedApproval = true;
      return await requestApprovalLoop({ uiRequestComponent, ...rest });
    }

    return requestDefer;
  })
  .callback();

export default (request) => {
  const ctx: any = { request: { ...request, requestedApproval: false } };
  return flowContext(ctx).finally(() => {
    if (ctx.request.requestedApproval) {
      flow.requestedApproval = false;
      // Close the notification popup after the flow completes, since all
      // approvals in the chain have been resolved/rejected by this point.
      notificationService.removeNotifiWindow();
      // only unlock notification if current flow is an approval flow
      notificationService.unLock();
    }
  });
};
