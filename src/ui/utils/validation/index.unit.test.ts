import { validateRecipient, validateAmountToSend } from './index';
import ErrorMessages from '../constants/errorMessages';

describe('validation utils', () => {
  describe('validateRecipient', () => {
    let mockSetRecipientError: jest.Mock;
    let mockRequest: jest.Mock;

    beforeEach(() => {
      mockSetRecipientError = jest.fn();
      mockRequest = jest.fn();
    });

    describe('KRC20 tokens (isKaspa = false)', () => {
      it('should set error when recipient is same as sender', async () => {
        await validateRecipient(mockRequest, 'same-address', 'same-address', false, mockSetRecipientError);

        expect(mockSetRecipientError).toHaveBeenCalledWith(ErrorMessages.KRC20.INVALID_RECIPIENT);
        expect(mockRequest).not.toHaveBeenCalled();
      });

      it('should validate different addresses', async () => {
        mockRequest.mockResolvedValue(true);

        await validateRecipient(mockRequest, 'recipient-address', 'sender-address', false, mockSetRecipientError);

        expect(mockRequest).toHaveBeenCalledWith('wallet:validate', ['recipient-address']);
        expect(mockSetRecipientError).toHaveBeenCalledWith(null);
      });
    });

    describe('KASPA (isKaspa = true)', () => {
      it('should allow sending to self', async () => {
        mockRequest.mockResolvedValue(true);

        await validateRecipient(mockRequest, 'same-address', 'same-address', true, mockSetRecipientError);

        expect(mockRequest).toHaveBeenCalledWith('wallet:validate', ['same-address']);
      });

      it('should validate valid address', async () => {
        mockRequest.mockResolvedValue(true);

        await validateRecipient(mockRequest, 'valid-kaspa-address', 'sender-address', true, mockSetRecipientError);

        expect(mockSetRecipientError).toHaveBeenCalledWith(null);
      });

      it('should set error for invalid address', async () => {
        mockRequest.mockResolvedValue(false);

        await validateRecipient(mockRequest, 'invalid-address', 'sender-address', true, mockSetRecipientError);

        expect(mockSetRecipientError).toHaveBeenCalledWith(ErrorMessages.KASPA.INVALID_RECIPIENT_ADDRESS);
      });
    });

    describe('error handling', () => {
      it('should handle validation request errors', async () => {
        const mockError = new Error('Network error');
        mockRequest.mockRejectedValue(mockError);

        await validateRecipient(mockRequest, 'some-address', 'sender-address', true, mockSetRecipientError);

        expect(mockSetRecipientError).toHaveBeenCalled();
        const errorArg = mockSetRecipientError.mock.calls[0][0];
        expect(errorArg).toContain('Error validating address');
      });
    });

    describe('isKaspa = undefined', () => {
      it('should treat undefined as non-Kaspa (KRC20)', async () => {
        await validateRecipient(mockRequest, 'same-address', 'same-address', undefined, mockSetRecipientError);

        expect(mockSetRecipientError).toHaveBeenCalledWith(ErrorMessages.KRC20.INVALID_RECIPIENT);
      });
    });
  });

  describe('validateAmountToSend', () => {
    let mockSetAmountError: jest.Mock;

    beforeEach(() => {
      mockSetAmountError = jest.fn();
    });

    describe('KASPA token', () => {
      const tokenTick = 'KASPA';
      const balance = 100;

      it('should set error for empty value', () => {
        validateAmountToSend(tokenTick, '', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.MORE_THAN_ZERO);
      });

      it('should set error for NaN value', () => {
        validateAmountToSend(tokenTick, 'invalid', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.MORE_THAN_ZERO);
      });

      it('should set error for zero value', () => {
        validateAmountToSend(tokenTick, '0', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.MORE_THAN_ZERO);
      });

      it('should set error for negative value', () => {
        validateAmountToSend(tokenTick, '-5', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.MORE_THAN_ZERO);
      });

      it('should set error for value below minimum (0.2 KAS)', () => {
        validateAmountToSend(tokenTick, '0.1', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.MINIMUM_KASPA);
      });

      it('should set error for value exceeding balance', () => {
        validateAmountToSend(tokenTick, '150', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.EXCEEDS_BALANCE(balance));
      });

      it('should clear error for valid amount', () => {
        validateAmountToSend(tokenTick, '50', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(null);
      });

      it('should accept minimum amount (0.2 KAS)', () => {
        validateAmountToSend(tokenTick, '0.2', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(null);
      });

      it('should accept amount equal to balance', () => {
        validateAmountToSend(tokenTick, '100', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(null);
      });
    });

    describe('non-KASPA tokens (KRC20)', () => {
      const tokenTick = 'TOKEN';
      const balance = 1000;

      it('should set error for NaN value', () => {
        validateAmountToSend(tokenTick, 'invalid', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.GENERAL(balance));
      });

      it('should set error for zero value', () => {
        validateAmountToSend(tokenTick, '0', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.GENERAL(balance));
      });

      it('should set error for negative value', () => {
        validateAmountToSend(tokenTick, '-5', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.GENERAL(balance));
      });

      it('should set error for value exceeding balance', () => {
        validateAmountToSend(tokenTick, '1500', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(ErrorMessages.SEND_AMOUNT.GENERAL(balance));
      });

      it('should clear error for valid amount', () => {
        validateAmountToSend(tokenTick, '500', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(null);
      });

      it('should accept small amounts (no minimum for KRC20)', () => {
        validateAmountToSend(tokenTick, '0.001', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(null);
      });

      it('should accept amount equal to balance', () => {
        validateAmountToSend(tokenTick, '1000', balance, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(null);
      });
    });

    describe('decimal amounts', () => {
      it('should handle decimal amounts correctly', () => {
        validateAmountToSend('TOKEN', '10.5', 100, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(null);
      });

      it('should handle very small decimal amounts', () => {
        validateAmountToSend('TOKEN', '0.00000001', 1, mockSetAmountError);
        expect(mockSetAmountError).toHaveBeenCalledWith(null);
      });
    });
  });
});
