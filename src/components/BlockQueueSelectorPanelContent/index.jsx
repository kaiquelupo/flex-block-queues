import React from "react";
import "./styles.css";
import * as Flex from '@twilio/flex-ui';
import { Manager } from '@twilio/flex-ui';
import SyncClient from "twilio-sync";
import { ID, getBlock, getSchedulesByQueue } from "../../utils";
import moment from 'moment-timezone';
import ScheduleDialog from '../ScheduleDialog';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';

var syncClient = new SyncClient(Manager.getInstance().user.token);

const StyledIconButton = withStyles({
    root: {
        padding: 0,
        minWidth: 15,        
    }
})(Button);

const styles = {
    contained: {
        borderRadius: "0px",
        textTransform: "uppercase",
        marginRight: "15px", 
        padding: "4px 20px",
        fontWeight: "bold",
        fontFamily: "inherit",
        fontSize: "11px"
    },
    inputRoot: {
        height: "20px"
    }
  };

let removed = {};

class QueueSelectorPanelContent extends React.Component {

    state = {
        schedules: [],
        showDialog: false,
        showQueueSidSchedules: null,
        selectedInfo: null
    }

    handleCloseClick = () => {
        Flex.Actions.invokeAction('SetComponentState', {
            name: 'QueueSelectorPanel',
            state: { isHidden: !this.props.isHidden }
        });
    }

    addSchedule = (item) => {

        syncClient.map('queue-block-schedules').then(function(map) {
            map.set(ID(), item);
        });

    }

   removeSchedule = (key, item) => {

      syncClient.map('queue-block-schedules').then(function(map) {
        map.update(key, {...item, removed: {
            worker: Flex.Manager.getInstance().workerClient.attributes.email,
            date: moment().format()
        }});
      });

    }

    componentDidMount() {

        syncClient.map('queue-block-schedules').then(function (map) {

            map.getItems().then(function(page) {

                this.setState({ schedules: 
                    page.items.reduce((pr, cur) => ({ ...pr, [cur.key]: cur.descriptor.data }), {})
                });

            }.bind(this));

            map.on('itemAdded', function({ item }) {

                this.setState({ schedules: {...this.state.schedules, [item.key]: item.descriptor.data } })

            }.bind(this));
            
            map.on('itemUpdated', function({ item }) {

                const newSchedules = { ...this.state.schedules };
                newSchedules[item.key] = item.descriptor.data;

                this.setState({ schedules: newSchedules })

            }.bind(this));

            map.on('itemRemoved', function (item) {

                removed = {
                    ...removed,
                    [item.key]: true
                }

            }.bind(this));

        }.bind(this));

        this.interval = setInterval(() => {
            this.setState({ time: Date.now() })
        }, 2000);

    }

    componentWillUnmount() { 
        clearInterval(this.interval);
    }

    getScheduleStatus = (item) => {

        if(!item.removed) {

            const { schedule } = (getBlock(item) || {});
            
            if(schedule) {
                
              return "active";

            } else {

                const { type: { value }, range: { end } } = item.schedule;

                if(value === "interval") {

                    if(moment().isAfter(moment(end))) {

                        return "out of range";

                    }

                }

            }
            
        }

        return "removed";
    }

    getSchedulesWithRemovedContext = () => {

        const { schedules } = this.state;

        return Object.keys(schedules).reduce((pr, cur) => {
            if(removed[cur]) {
                return { 
                    ...pr,
                    [cur]: { 
                        ...schedules[cur],
                        removed: true
                    }
                }
            }

            return { ...pr, [cur]: schedules[cur] };
        }, {});
    }

    render () {

        const { showQueueSidSchedules } = this.state;
        const { classes } = this.props;

        const schedules = this.getSchedulesWithRemovedContext();
        const schedulesByQueue = getSchedulesByQueue(schedules);

        return (
            <Flex.SidePanel
                displayName="QueueSelectorPanel"
                className="queueSelectorPanel"
                isHidden={false}
                title={<div>{Flex.Manager.getInstance().strings.BlockQueueSelectorPanelTitle}</div>}
                handleCloseClick={this.handleCloseClick}
            >
                <div className="header">
                    <div className="header-description">
                    </div>
                    <div className="header-button-wrapper">
                        <Button 
                            variant="contained" 
                            color="primary" 
                            classes={{
                                contained: classes.contained
                            }}
                            onClick={() => this.setState({ showDialog: true })}
                        >
                            Add
                        </Button>
                    </div>
                </div>

                {Object.keys(schedulesByQueue).map(queueSid => {

                    const schedulesKeys = Object.keys(schedulesByQueue[queueSid])
                    const queueName = schedules[schedulesKeys[0]].queue.label;
                
                    return (

                        <div className="queueItem" key={queueSid}>
                            <div className="queueLine">
                                <div className="queueTitle">{queueName}</div>
                                <div className="queueItemButtons">
                                    <StyledIconButton onClick={() => 
                                        this.setState({ showQueueSidSchedules: showQueueSidSchedules === queueSid ? null : queueSid })
                                    }>
                                        <Flex.Icon icon="DirectoryBold" />
                                    </StyledIconButton>
                                </div>
                            </div>
                            { showQueueSidSchedules === queueSid && schedulesKeys.map((key) => { 

                                const schedule = schedulesByQueue[queueSid][key];

                                const status = this.interval && this.getScheduleStatus(schedule);

                                return (
                                    <div className="scheduleItem" key={key}>
                                        <div className="scheduleItemFirstPart">
                                            {!schedule.removed && <StyledIconButton onClick={() => this.removeSchedule(key, schedule)}>
                                                <Flex.Icon icon="Close"/>
                                            </StyledIconButton>}
                                            <StyledIconButton className="scheduleItemTitle" onClick={() => this.setState({ showDialog: true, selectedInfo: schedule })}>
                                                {schedule.name}
                                            </StyledIconButton>
                                        </div>
                                        <div>
                                            {status}
                                        </div>
                                    </div> 
                                )
                            })}
                        </div>
                    )
                })}

                {this.state.showDialog && <ScheduleDialog
                    addScheduleItem={(item) => this.addSchedule(item)}
                    onClose={() => this.setState({ showDialog: false, selectedInfo: null })}
                    selectedInfo={this.state.selectedInfo}
                />}

              
                
            </Flex.SidePanel>
        )
    } 
       
    
}

export default withStyles(styles)(QueueSelectorPanelContent);