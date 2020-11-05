const moment = require("moment-timezone");
const { get } = require("lodash");

const { TIMEZONE } = process.env;

if(TIMEZONE) {
  moment.tz.setDefault(TIMEZONE);
}

const dateString = "MM/DD/YYYY HH:mm";

const updateMaps = async (client, schedules) => {

  for(let i = 0; i < schedules.length; i++) {

    let toRemove = false;

    const { schedule, removed } = schedules[i];

    if (schedule.type.value === "interval") {

        const { range: { end } } = schedule;
        
        if(moment().isAfter(
          moment(end)
        )){

          toRemove = true;
        }
    }

    if(removed) {
      toRemove = true;
    }

    if(toRemove) {
      await removeMapItem(client, schedules[i]);
    }

  }
  
}

const removeMapItem = async (client, item) => {
  try {

    const { MAP_SERVICE_SID, MAP_SID } = process.env;

    await client.sync.services(MAP_SERVICE_SID)
      .syncMaps(MAP_SID)
      .syncMapItems(item.key)
      .remove({ ifMatch: item.revision });

    await addToHistoricReport(client, item);

  } catch (err) {

    console.log("Error to update sync document");
    console.log(err);

  }
}

addToHistoricReport = async (client, schedule) => {

  const { schedule: { type: { value }, range }, removed } = schedule;

  if(
    (value === "interval" && moment(removed ? removed.date : undefined).isAfter(range.start)) ||  
    value === "recurring"
  ) {
      await sendToFlexInsights(client, schedule);
  }

}

parseHour = (hour) => {
  return hour.slice(0,2) + ":" + hour.slice(2,4)
}

sendToFlexInsights = async (client, item) => {

  const { 
    name, schedule: { type: { value }, range }, created: { worker, date: dateCreated }, 
    removed, queue: { label: queueName }, incoming, transfer
  } = item;

  const { WORKSPACE, WORKFLOW } = process.env;

  let start;
  let end;
  let days = null;

  if(value === "interval") {

    start = moment(range.start).format(dateString);
    end = moment(range.end).format(dateString);

  }

  if(value === "recurring") {

    start = parseHour(range.startHour); 
    end = parseHour(range.endHour);
    days = range.week.join(",");

  }

  const attributes = {
    conversations: {
      case: name,
      activity_time: value,
      conversation_attribute_1: start,
      conversation_attribute_2: end,
      conversation_attribute_3: days,
      workflow: `${incoming.active ? "Incoming" : ""}${incoming.active && transfer.active ? " and " : ""}${transfer.active ? "Transfer" : ""}`,
      content: incoming.active ? get(incoming, "reason.label", null) : null,
      conversation_attribute_4: incoming.active ? get(incoming, "fallbackQueues", []).map(({ label }) => label).join(",") : null, 
      campaign: transfer.active ? get(transfer, "reason.label") : null,
      conversation_attribute_5: transfer.active ? get(transfer, "originationQueues", []).map(({ label }) => label).join(",") : null, 
      conversation_attribute_6: transfer.active ? get(transfer, "fallbackQueues", []).map(({ label }) => label).join(",") : null,
      queue: queueName,
      initiated_by: worker,
      activity: moment(dateCreated).format(dateString),
      hang_up_by: removed ? removed.worker : "system",
      abandoned: moment(removed ? removed.date : get(range, "end", undefined)).format(dateString),
      kind: "Queue Block",
      virtual: "Yes"
    }
  };
   
  await client.taskrouter
    .workspaces(WORKSPACE)
    .tasks.create({
      attributes: JSON.stringify(attributes),
      workflowSid: WORKFLOW, 
      timeout: 1
    });

}

exports.handler = async function(context, event, callback) {

  try {

    const client = context.getTwilioClient();

    const { MAP_SERVICE_SID, MAP_SID } = process.env;

    const maps = await client.sync.services(MAP_SERVICE_SID)
      .syncMaps(MAP_SID)
      .syncMapItems
      .list();

    const schedules = maps.map(item => ({ ...item.data, revision: item.revision, key: item.key }));
      
    await updateMaps(client, schedules);

    callback(null);

  } catch (err) {

    console.log(err);
    callback(null);

  }

};
