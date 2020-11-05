# Block Queues

This plugin allows admins and supervisors to tag queues as blocked during a scheduled period of time for both incoming or transfer calls. To do that, we are using Flex, Sync and Functions. Flex UI will allow supervisors and admins to insert the period of time to block a queue (interval or recurring) while Sync will register that. Finally, Functions will be used to check if a queue is tagged as blocked informing your system to not route any task to this queue. 

Every time we verify if a queue is blocked for incoming calls, we also check if there are removed schedules or out of range schedules that once blocked any queue (incoming or transfer). If so, these schedules are removed from the sync map and their information sent to a Flex Insights Report. This strategy follows a "garbage collector" concept in order to replace the use of a CRON job to check date making it possible to use Twilio Functions without the need of third-party systems.     

<p align="center">
    <img src="screenshots/example_1.png?raw=true" width="600" >
</p>