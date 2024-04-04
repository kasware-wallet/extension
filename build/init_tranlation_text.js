const { Client } = require('@notionhq/client');
const { notionKey } = require('../.key.config.js');
const { token } = notionKey;
const notion = new Client({ auth: token });
const trans = require('./_raw/_locales/en/messages.json')

const run = async (trans) => {
    for (const [key, value] of Object.entries(trans)) {
        console.log(`${key}`);
        const obj = {
            parent: {
                database_id: '60da59ea394e4ad8a69cc308112ec323',
            },
            properties: {
                'Name': {
                    type: 'title',
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: key,
                            },
                        },
                    ],
                },
    
            },
        }
        const response = await notion.pages.create(obj);
        // console.log(response);
      }


};

run(trans)