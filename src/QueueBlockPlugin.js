import React from 'react';
import { FlexPlugin } from 'flex-plugin';
import BlockQueueSelector from './components/BlockQueueSelector';
import BlockQueueSelectorPanel from './components/BlockQueueSelectorPanel';
import BlockQueueWarning from './components/BlockQueueWarning';
import { beforeTransferTask } from './actions';
import moment from 'moment-timezone';

const PLUGIN_NAME = 'QueueBlockPlugin';

export default class QueueBlockPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {

    const { TIMEZONE } = process.env;

    if(TIMEZONE) {
      moment.tz.setDefault(TIMEZONE);
    }

    flex.Notifications.registerNotification({
      id: "blockQueueWarning",
      content: <BlockQueueWarning />,
      type: flex.NotificationType.info
    });

    manager.strings.BlockQueueSelectorPanelTitle = "BLOCK QUEUES";
    
    const { roles } = manager.workerClient.attributes;

    if(roles && (roles.includes("admin") || roles.includes("supervisor"))) {

      flex.MainHeader.Content.add(<BlockQueueSelector key="block-queue-selector"/>, {
        align: "start"
      });

      flex.MainContainer.Content.add(<BlockQueueSelectorPanel key="block-queue-selector-panel" />);
    }

    flex.Actions.addListener("beforeTransferTask", beforeTransferTask);
    
  }

}
