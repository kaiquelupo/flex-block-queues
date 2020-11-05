import moment from 'moment-timezone';

const days = {
    "Mon": 1,
    "Tue": 2,
    "Wed": 3,
    "Thu": 4,
    "Fri": 5,
    "Sat": 6,
    "Sun": 7
}

export const getBlock = (item, originationQueueSid) => {

    const { transfer, schedule, removed } = item;

    let insideInterval = false;

    if(!removed) {

        if(transfer.active || (originationQueueSid === undefined)) {   

            if (schedule.type.value === "interval") {

                const { range: { start, end} } = schedule;
                
                if(moment().isBetween(
                    moment(start), 
                    moment(end)
                )){
                    insideInterval = true;
                }
            }

            if(schedule.type.value === "recurring") {
                const { range: { week, startHour, endHour }} = schedule;

                const currentWeekDay = moment().isoWeekday();
                const weekDays = week.map(day => days[day]);
                const current = parseInt(moment().format("HHmm"));
                const start = parseInt(startHour);
                const end = parseInt(endHour);

                if(current >= start && current < end && weekDays.includes(currentWeekDay)){

                    insideInterval = true;

                }
            }

            if(originationQueueSid && insideInterval) {
                const { originationQueues } = transfer;
                const originationQueuesSids = originationQueues.map(({ value }) => value);

                insideInterval = originationQueuesSids.includes("all") || originationQueuesSids.includes(originationQueueSid);
            }
        }

    }   

    return insideInterval ? item : null;
}

export const getSchedulesByQueue = (schedules) => {

    return Object.keys(schedules).reduce((pr, cur) => {

        const item = schedules[cur];

        return {
            ...pr,
            [item.queue.value]: {
                ...(pr[item.queue.value] || {}),
                [cur]: item
            }
        }
    }, {});

}

export const getSchedulesByKey = (items) => {

    return items.reduce((pr, cur) => ({ ...pr, [cur.key]: cur.descriptor.data }), {})

}


export const ID =  () => {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
};