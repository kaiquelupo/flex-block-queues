import React from 'react';

const BlockQueueWarning = (props) => {
    
    const { notificationContext: { name, reason, queue } } = props; 

    let description = `The transfer for this queue is blocked right now by scheduled block called "${name}". Reason: ${reason}`;

    if(queue) {

        description = `The transfer for this queue is blocked right now but it is being redirected to queue "${queue}". Reason: ${reason}`;

    }

    return (
        <div>{description}</div>
    )
}

export default BlockQueueWarning;