import React from "react";
import "./styles.css";
import { connect } from 'react-redux';
import BlockQueueSelectorPanelContent from '../BlockQueueSelectorPanelContent';

class BlockQueueSelectorPanel extends React.Component {

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
    const BlockQueueSelectorPanelState = componentViewStates && componentViewStates.BlockQueueSelectorPanel;
    const isHidden = BlockQueueSelectorPanelState && BlockQueueSelectorPanelState.isHidden;

    return {
        isHidden,
        workerAttributes
    }
};


export default connect(mapStateToProps)(BlockQueueSelectorPanel);