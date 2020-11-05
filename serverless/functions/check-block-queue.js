const moment = require("moment-timezone");
const axios = require("axios");

const { TIMEZONE } = process.env;

if(TIMEZONE) {
  moment.tz.setDefault(TIMEZONE);
}

const days = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7
}

const getQueueBlock = (schedules, queueSid) => {

  const queueSchedules = schedules.filter(item => item.queue.value === queueSid);

  const validSchedules = queueSchedules.reduce((pr, cur) => {
    const block = getBlock(cur);

    if(block) {
        return [...pr, block];
    }

    return pr;

  }, []);

  if(validSchedules.length > 0) {

    const { name, incoming: { reason, fallbackQueues }} = validSchedules[0];

    return { 
      name, 
      reason, 
      fallbackQueues: 
        fallbackQueues.filter(fallbackQueue => getQueueBlock(schedules, fallbackQueue.value) === null) 
    }

  }

  return null

}

const getBlock = (item) => {

  const { incoming, schedule, active } = item;

  let insideInterval = false;

  if(active) {

    if(incoming.active) {   

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
    }   

  }

  return insideInterval ? item : null;
}

exports.handler = async function(context, event, callback) {

  try {

    const client = context.getTwilioClient();

    const { MAP_SERVICE_SID, MAP_SID, DOMAIN } = process.env;
    const { queueSid } = event;

    axios.post(`${DOMAIN}/update-schedules`);

    if(!queueSid) {
      callback(null);
      return;
    }

    const maps = await client.sync.services(MAP_SERVICE_SID)
      .syncMaps(MAP_SID)
      .syncMapItems
      .list();

    const schedules = maps.map(item => ({ ...item.data, revision: item.revision, key: item.key }));

    callback(null, {
      block: getQueueBlock(schedules, queueSid)
    });

  } catch (err) {

    console.log(err);
    callback(null);

  }

};
