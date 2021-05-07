# GroupFinder
### This bot assists with the following functions:
  -	Assist students in finding study groups and tutoring groups
  -	Automatically create channels for groups to use
  -	Store professor information for later student reference
  -	Track students able to act as tutors/helpers for both groups and classes

Students and professors interact with the bot directly through the Discord web application. Commands are run by sending messages with the following format:
  `<prefix> <command> (optional_arg) <arg: arg_type/arg_value> <...compiled_arg>`
  
It should be noted that unless `...` is present, arguments are separated by spaces and putting a space between things **will** register it as a different argument. When `...` is present, the bot automatically appends everything past that point as the argument.

The "prefix" to the bot is it's Discord user mention. Ex:
@GroupFinder status

## Installation Instructions
Want to run your own version of GroupFinder? All you need is Node.JS (https://nodejs.org/en/) and this repo. 
1. Clone the repository (`git clone https://github.com/AndroidWaifu/GroupFinder`)
2. Install dependencies (`npm install`)
3. Create a Discord bot at https://discord.com/developers/applications/ (More info on this can be found through Google)
4. Copy the token from the bot created above
5. Create the environment file. (Save a file with the name `.env`).
  - Add the bot token line (`TOKEN="{Put your token here}"`)
  - (Optional) Add the log level of the bot (`LOG_LVL="{Log Level Desired}"`). Log levels can be found at https://github.com/AndroidWaifu/Skelebot under the Log Level section.
6. Start the bot (`npm run start`)

## User Manual (Commands)
### GroupFinder has 13 commands specific to providing the above functionality. There are 18 commands total.
*Only the GroupFinder specific commands and the help command will be listed here. For information on the remaining commands, use the help command.*

### Format
#### Full Command Name
  - Syntax
  - Description
  - Special Information

#### Help
  - help <command_group>
  - Displays the default bot commands
  - Command groups can be found using the **groups** command found in the help command.
#### Create Class 
  - createclass <name>
  - Create a new class and the corresponding role
  - Fetches the role if it already exists.
#### Del Class
  - delclass <name>
  - Delete a class
  - N/A
#### Registerr
  - register <name>
  - Adds users to the student database
  - N/A
#### Dropout
  - dropout
  - Remove yourself from the student database
  - N/A
#### Tutor Class
  - tutorclass <class> (Official: True/False)
  - Toggles you as a tutor for 'class'. School-affiliated tutors are considered 'Official'
  - Marking yourself as "Official" requires special permissions in a Guild. Requires registration as a student.
#### Tutors
  - tutors <class>
  - List the tutors for a class
  - N/A
#### Create Group
  - creategroup <class> <group_name> (max_members)
  - Create a study or tutor group
  - N/A
#### Find Group
  - findgroup <class>
  - List the groups for a given class
  - N/A
#### Join Group
  - joingroup <class> <group>
  - Join a class group
  - If already a part of a group, this will remove you from the group. (This command may be renamed later)
#### Tutor Group
  - tutorgroup <class> <group> (Official: True/False)
  - Become the tutor for a group
  - Marking yourself as "Official" requires special permissions in a Guild. Requires registration as a student.
#### Professor
  - professor <first_name> <last_name> <email>
  - Save or update professor information
  - This command should only be used by the professor attempting to register. Requires special permissions in a Guild.
#### Save Office
  - saveoffice <office_name> <...info>
  - Save or update office information for student reference
  - Professors can have multiple offices! 
#### Search Professor
  - searchprofessor <last_name>
  - Fetch a professor's email and office hours by last name
  - N/A
