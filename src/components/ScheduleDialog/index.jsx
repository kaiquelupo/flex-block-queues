import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DatetimeRangePicker from 'react-datetime-range-picker'; 
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Select from 'react-select';
import moment from 'moment-timezone';
import * as Flex from '@twilio/flex-ui';
import { InputLabel, DialogTitle, TextField } from '@material-ui/core';
import RecurringSchedule from '../RecurringSchedule';
import { debounce, get } from 'lodash';
import "./styles.css";

const reasons = [
    { label: "Default", value: "default" },
    { label: "Business Hour", value: "business_hour"}
]

class ScheduleDialog extends React.Component {

    state = {
        active: true,
        queue: null,
        transfer: {
            active: false,
            originationQueues: [{ label: "All", value: "all" }],
            reason: reasons[0]
        },
        incoming: {
            active: false,
            reason: reasons[0],
        },
        schedule: {
            type: null
        },
        name: null,
        search: "",
        queues: []
    }

    handleQueuesUpdate = debounce((e) => {

            this.getQueues(e || "");        

        }, 250, { 'maxWait': 1000 }
    )

    getQueues = (value) => {

        Flex.Manager.getInstance().insightsClient.instantQuery('tr-queue').then((q) => {
            
            q.on('searchResult', (queues) => {

                this.setState({ 
                    queues: Object.keys(queues).map(queueSid => ({
                        label: queues[queueSid].queue_name,
                        value: queueSid
                    }))
                });

            });

            q.search(value !== "" ? `data.queue_name CONTAINS "${value}"` : "");
        });

    }

    componentDidMount() {

        const { selectedInfo } = this.props; 

        if(selectedInfo) {
            this.setState({ ...this.props.selectedInfo });
        }

    }

    handleSchedule = () => {

        const { transfer, incoming, schedule, name } = this.state;

        if(!name) {
            alert("You need to add a friendly name");
            return;
        }

        if(!get(schedule, "range", false)) {

            alert("You need to add a schedule"); 
            return;

        }

        if(!(incoming.active || transfer.active)) {

            alert("You need to choose at least one situation to block this queue");
            return;

        }

        if(incoming && incoming.active){

            if(get(incoming, "fallbackQueues", []).length === 0) {
                alert("You need to add at least one value to fallback queues in incoming");
                return;
            }

        }

        if(transfer && transfer.active){

            if(get(transfer, "fallbackQueues", []).length === 0) {
                alert("You need to add at least one value to fallback queues in transfer");
                return;
            }

            if(get(transfer, "originationQueues", []).length === 0) {
                alert("You need to add at least one value to origination queues in transfer");
                return;
            }
        }

        const obj =  { ...this.state, created: {
            worker: Flex.Manager.getInstance().workerClient.attributes.email,
            date: moment().format() 
        }}; 

        delete obj.search;
        delete obj.queues;

        this.props.addScheduleItem(obj);

        this.props.onClose();

    }

    render() {
        const { onClose, selectedInfo } = this.props;
        const { incoming, transfer, schedule, queues, name, queue } = this.state;
        const { REACT_APP_TIMEZONE: timezone } = process.env;

        const disabled = selectedInfo ? true : false;

        return (
            <Dialog open={true} onClose={onClose}>
                <DialogTitle>Block Queue</DialogTitle>
                <div className="dialogWrapper">
                        <div>
                            <TextField
                                placeholder="Friendly Name"
                                fullWidth
                                InputLabelProps={{
                                    shrink: true
                                }}
                                disabled={disabled}
                                value={name || ""}
                                onChange={(event) => this.setState({ name: event.target.value })}
                            />
                        </div>
                        <div className="queueSelectorWrapper">
                            <InputLabel>Queue</InputLabel>
                            <Select
                                className="basic-single"
                                classNamePrefix="select"
                                isSearchable={true}
                                onChange={(queue) => this.setState({ queue })}
                                name="queue"
                                options={queues}
                                value={queue}
                                isDisabled={disabled}
                                maxMenuHeight={150}
                                onInputChange={this.handleQueuesUpdate}
                                onFocus={() => this.getQueues("")}
                            />
                        </div>
                        <div className="checkWrapper">
                            <FormControlLabel
                                control={
                                <Checkbox
                                    checked={incoming.active}
                                    onChange={() => this.setState({ incoming: { ...incoming, active: !incoming.active }})}
                                    name="incoming"
                                    color="primary"
                                    disabled={disabled}
                                />
                                }
                                label="Incoming"
                            />
                            
                            {incoming.active && (
                                <div>
                                    <InputLabel>Reason</InputLabel>
                                    <Select
                                        className="basic-single"
                                        classNamePrefix="select"
                                        isSearchable={true}
                                        onChange={(reason) => this.setState({ incoming: { ...incoming, reason }})}
                                        name="incoming_reason"
                                        options={reasons}
                                        value={incoming.reason}
                                        isDisabled={disabled}
                                    />
                                    <InputLabel>Fallback Queues</InputLabel>
                                    <Select 
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        isMulti
                                        isSearchable={true}
                                        name="queues"
                                        maxMenuHeight={150}
                                        onChange={(queues) => this.setState({ incoming: {...incoming, fallbackQueues: queues }})}
                                        options={[{ label: "None", value: "none"}, ...queues]}
                                        value={incoming.fallbackQueues || null}
                                        onInputChange={this.handleQueuesUpdate}
                                        onFocus={() => this.getQueues("")}
                                        isDisabled={disabled}
                                    />
                                </div>
                            )}

                        </div>
                        <div className="checkWrapper">
                            <FormControlLabel
                                control={
                                <Checkbox
                                    checked={transfer.active}
                                    onChange={() => this.setState({ transfer: {...transfer, active: !transfer.active }})}
                                    name="transfer"
                                    color="primary"
                                    disabled={disabled}
                                />
                                }
                                label="Transfer"
                            />
                            {transfer.active && (
                                <div>
                                    <InputLabel>Reason</InputLabel>
                                    <Select
                                        className="basic-single"
                                        classNamePrefix="select"
                                        isSearchable={true}
                                        onChange={(reason) => this.setState({ transfer: { ...transfer, reason }})}
                                        name="transfer_reason"
                                        options={reasons}
                                        value={transfer.reason}
                                        isDisabled={disabled}
                                    />
                                    <InputLabel>Origination Queues</InputLabel>
                                    <Select 
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        isMulti
                                        isSearchable={true}
                                        name="queues"
                                        maxMenuHeight={150}
                                        onChange={(queues) => this.setState({ transfer: {...transfer, originationQueues: queues }})}
                                        options={[{ label: "All", value: "all"}, ...queues]}
                                        value={transfer.originationQueues}
                                        onInputChange={this.handleQueuesUpdate}
                                        onFocus={() => this.getQueues("")}
                                        isDisabled={disabled}
                                    />
                                
                                    <InputLabel>Fallback Queues</InputLabel>
                                    <Select 
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        isMulti
                                        isSearchable={true}
                                        name="queues"
                                        maxMenuHeight={150}
                                        onChange={(queues) => this.setState({ transfer: {...transfer, fallbackQueues: queues }})}
                                        options={[{ label: "None", value: "none"}, ...queues]}
                                        value={transfer.fallbackQueues || null}
                                        onInputChange={this.handleQueuesUpdate}
                                        onFocus={() => this.getQueues("")}
                                        isDisabled={disabled}
                                    />
                                    
                                </div>
                            )}
                        </div>
                        <div>
                            <InputLabel>Schedule</InputLabel>
                            <Select 
                                className="basic-single"
                                classNamePrefix="select"
                                isSearchable={true}
                                name="queues"
                                maxMenuHeight={150}
                                onChange={(elem) => { this.setState({ schedule: { ...schedule, type: elem }})}}
                                options={[
                                    { label: "Interval", value: "interval" },
                                    { label: "Recurring", value: "recurring" }
                                ]}
                                value={schedule.type || null}
                                isDisabled={disabled}
                            />
                            {(schedule.type && schedule.type.value === "interval") && (

                                <div className={disabled ? "disabledScheduleForm" : "scheduleForm"}>
                                    {disabled ? (
                                        <div>
                                            <div>Start: {moment(schedule.range.start).format("MM/DD/YYYY HH:mm")}</div>
                                            <div>End: {moment(schedule.range.end).format("MM/DD/YYYY HH:mm")}</div>
                                        </div>
                                    ) : (
                                    <DatetimeRangePicker
                                        dateFormat="DD/MM/YYYY"
                                        timeFormat="HH:mm"
                                        onChange={({start, end}) => { 
                                            this.setState({ schedule: {...schedule, range: { start, end }}});
                                        }} 
                                        startDate={get(schedule, "range.start", moment().seconds(0).toDate()) }
                                        endDate={get(schedule, "range.end", moment().seconds(0).toDate())}
                                    />)}
                                </div>
                                
                            )}
                            {(schedule.type && schedule.type.value === "recurring") && (
                                <RecurringSchedule 
                                    updateRecurringSchedule={(range) => 
                                        this.setState({ schedule: {...schedule, range }})
                                    }
                                    selectedInfo={selectedInfo && schedule.range}
                                />
                            )}
                        </div>
                        {timezone && 
                            <div className="timezoneWarning">Timezone: {timezone}</div>  
                        }                  
                </div>
                <DialogActions>
                    <Button
                        color="primary"
                        onClick={this.handleSchedule}
                        disabled={disabled}
                    >
                        Schedule
                    </Button>
                    <Button
                        onClick={onClose}
                        color="secondary"
                    >
                        Exit
                    </Button>
                </DialogActions>
            </Dialog>
        )   
    }
}

export default ScheduleDialog;