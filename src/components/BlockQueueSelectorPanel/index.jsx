import React from "react";
import "./styles.css";
import { connect } from 'react-redux';
import BlockQueueSelectorPanelContent from '../BlockQueueSelectorPanelContent';

class QueueSelectorPanel extends React.Component {

    render () {
        const { isHidden } = this.props;

        return !isHidden && (
           <BlockQueueSelectorPanelContent />
        )
    } 
       
    
}

const mapStateToProps = state => {

    const workerAttributes = state.flex.worker.attributes;
    const componentViewStates = state.flex.view.componentViewStates;
    const QueueSelectorPanelState = componentViewStates && componentViewStates.QueueSelectorPanel;
    const isHidden = QueueSelectorPanelState && QueueSelectorPanelState.isHidden;

    return {
        isHidden,
        workerAttributes
    }
};


export default connect(mapStateToProps)(QueueSelectorPanel);