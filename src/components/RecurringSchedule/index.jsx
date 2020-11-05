import React from 'react';
import sharedTheme from '../../styling/theme';
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import InputMask from "react-input-mask";
import { isEqual } from 'lodash';

const DAYS = ["All", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const styles = theme => (sharedTheme(theme));

class RecurringSchedule extends React.Component {

    state = {
        selected: DAYS,
        startHour: "0000",
        endHour: "2359",
        allDisabled: false
    }

    componentDidMount() {

        const { selectedInfo } = this.props;

        if(selectedInfo) {
            this.populateState();
        } else {
            this.updateParentState();
        }
    }

    componentDidUpdate(prevProps, prevState) {

        if (!isEqual(prevState, this.state)) {

            this.updateParentState();
            
        }
    }


    populateState = () => {

        const { selectedInfo } = this.props;

        this.setState({
            ...selectedInfo,
            selected: selectedInfo.week,
            allDisabled: true
        });

    }

    updateParentState = () => {

        const { updateRecurringSchedule } = this.props;

        updateRecurringSchedule({
            week: this.state.selected.filter(elem => elem !== "All"),
            startHour: (this.state.startHour).replace(":", ""),
            endHour: (this.state.endHour).replace(":", "")
        })
    }

    handleDayChange = (event) => {
        const { name, checked } = event.target;

        if(name === "All") {
            this.setState({ selected: checked ? DAYS : [] })
        } else {
            this.setState( { selected: checked ? 
                [...this.state.selected, name ] : 
                this.state.selected.filter(elem => elem !== name)
            })
        }

    };

    handleStartHourChange = (event) => { 
        this.setState({ startHour: event.target.value })
    }
    handleEndHourChange = (event) => {
        this.setState({ endHour: event.target.value })
    }

    render() {
        const { classes } = this.props;
        const { selected, allDisabled } = this.state;

        return (
            <div className={classes.scheduleForm}>
                <FormControl component="fieldset">
                    <FormLabel component="legend">Days of the Week</FormLabel>
                    <FormGroup row>
                        {DAYS.map(day => (
                            <FormControlLabel
                                key={day}
                                control={
                                    <Checkbox 
                                        checked={selected.includes(day)}
                                        color="primary"
                                        onChange={this.handleDayChange} 
                                        name={day}
                                        disabled={(selected.length === 8 && day !== "All") || allDisabled}
                                    />}
                                label={day}
                                labelPlacement="end"
                            />
                        ))}
                    </FormGroup>
                    <div className={classes.dateBox}>
                        <div className={classes.dateInputBox}>
                            <FormLabel component="legend">Start Hour</FormLabel>
                            <InputMask 
                                mask="99:99"
                                value={this.state.startHour}
                                onChange={this.handleStartHourChange}
                                className={classes.dateInput}
                                disabled={allDisabled}
                            ></InputMask>
                        </div>
                        <div className={classes.dateInputBox}>
                            <FormLabel component="legend">End Hour</FormLabel>
                            <InputMask 
                                mask="99:99"
                                value={this.state.endHour}
                                onChange={this.handleEndHourChange}
                                className={classes.dateInput}
                                disabled={allDisabled}
                            ></InputMask>
                        </div>
                    </div>
                </FormControl>
            </div>
        )   
    }
}

export default withStyles(styles)(RecurringSchedule);