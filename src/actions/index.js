import * as Flex from '@twilio/flex-ui';
import { Manager } from '@twilio/flex-ui';
import SyncClient from "twilio-sync";
import { getBlock } from '../utils';

export const beforeTransferTask = async (payload, abortFunction) => {

    const { targetSid, task: { queueSid: originationQueueSid } } = payload;

    var syncClient = new SyncClient(Manager.getInstance().user.token);

    const map = await syncClient.map('queue-block-schedules');

    const { items } = await map.getItems();

    const schedules = items.map(item => item.descriptor.data);

    if(schedules) {

        const block = getTransferBlock(schedules, targetSid, originationQueueSid);
        
        if(block) {

            const { name, reason, fallbackQueues } = block;

            const fallbackQueue = fallbackQueues[0] || {};

            if(fallbackQueue.value === "none") {
               
                Flex.Notifications.showNotification("blockQueueWarning", { 
                    name,
                    reason
                });

                abortFunction();

            } else if (fallbackQueue.value) {

                payload.targetSid = fallbackQueue.value;

                Flex.Notifications.showNotification("blockQueueWarning", { 
                    name,
                    reason,
                    queue: fallbackQueue.label
                });

            }

        }

    }

}   

const getTransferBlock = (items, targetSid, originationQueueSid) => {

    const schedules = items.filter(item => item.queue.value === targetSid );

    const validSchedules = schedules.reduce((pr, cur) => {
        const block = getBlock(cur, originationQueueSid);

        if(block) {
            return [...pr, block];
        }

        return pr;

    }, []);

    if(validSchedules.length > 0) {

        const { name, transfer: { reason: { label }, fallbackQueues }} = validSchedules[0];
           
        return {
            name,
            reason: label,
            fallbackQueues: 
                fallbackQueues.filter(fallbackQueue => getTransferBlock(items, fallbackQueue.value, originationQueueSid) === null) 
        };

    }
    
    return null;

}