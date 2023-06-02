## Two new features I add:

1. Reviewing quest
2. Update and delete quest
3. And some minor improvements (improve the submit function, etc.)

Reviewing is crucial part in stackup. So I choose this features. Before I add the reviewing, I improve some of the codes like adding submission. It feels weird when the admin review nothing except the player address. So I added a submission which is a string type. It's almost impossible adding attachments as submission. I simplified with only a string as a the submission player can give. Then I mapped the submission like the playerQuestStatuses. I also Added onlyAdmin modifier and addded 3 new status in the PlayerQuestStatus which is Rejected, Approved and Rewarded.

I Added interesting part in the Submit quest function is the emit event. Those are good for storing log of the submission. Maybe you guys wondering 'why emit event?' There's a lot of reason. First, the admin or reviewer can't review the submission if you don't know the player address. For testing it works because we have a lot of address to test and just copy paste. But in reality the reviewer don't know the player address submission. The Emit event store the value of player submission, address, and the questId. When it got called in front end part, it will show the log of the submission. Second, The log are in historical order. Just like stackup **first-come-first-basis**. So emit event is the best choice. It's not just show people submission, but also whom first submit it.

Here's an example of people submission in the front-end with help of emit event:

![image](https://github.com/DjorroDev/first-DApp/assets/84728626/1b059b22-613c-4be8-ab50-f40db4184292)



The Update and delete is actually pretty simple and straigt forward. Just like how edit and deleting something. First validating isAdmin and isQuestExist then update/delete.

<!-- # How to Install: (Coming soon)

### prerequisites

You need metamask and enable testnet -->
