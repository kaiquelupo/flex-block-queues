import React from "react";
import "./styles.css";
import * as Flex from '@twilio/flex-ui';
import { connect } from 'react-redux';

class QueueSelector extends React.Component {

    toggleBlockQueueSelectorPanel = () => {
        
        Flex.Actions.invokeAction('SetComponentState', {
            name: 'BlockQueueSelectorPanel',
            state: { isHidden: !this.props.isHidden }
        });

    }

    componentDidMount() {
        Flex.Actions.invokeAction('SetComponentState', {
            name: 'BlockQueueSelectorPanel',
            state: { isHidden: (typeof this.props.isHidden === "undefined") ? true : this.props.isHidden  }
        });
    }

    render () {

        return (
            <div className="wrapper">
                <div className="tray" onClick={this.toggleBlockQueueSelectorPanel}>
                    <Flex.Icon icon="TasksSmall"  />
                </div>
            </div>
        )
    } 
       
    
}

const mapStateToProps = state => {
    const componentViewStates = state.flex.view.componentViewStates;
    const BlockQueueSelectorPanelState = componentViewStates && componentViewStates.BlockQueueSelectorPanel;
    const isHidden = BlockQueueSelectorPanelState && BlockQueueSelectorPanelState.isHidden;

    return {
        isHidden
    }
};

export default connect(mapStateToProps)(QueueSelector);