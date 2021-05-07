import { EmbedFieldData, MessageEmbed } from "discord.js";
import { Bot, Command } from "../bot";
import { DEV_ID, log, logAll } from "../vars";


export const init = (client: Bot) => {
  SQL.CREATE.forEach((statement) => {
    client.db.prepare(statement).run();
  });
};
export const group = "GroupFinder";
export const commands: Command[] = [
  {
    name: "createclass",
    desc: "Create a new class and corresponding role",
    args: "<name>",
    can_run: (message, _client) => {
      if (message.member)
        return message.member.hasPermission("MANAGE_ROLES");
      return false;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      if (!guild || !args[0])
        return;

      // Check if class exists
      if (client.db.prepare("SELECT * FROM Class WHERE (Guild=? AND Name=?)").get(
        guild.id, args[0]
      ))
      {
        const embed = client.genBotEmbed("Create Class");
        embed.addField(
          'Error', 'That class already exists!'
        );
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }
      
      // Make the class role (or fetch if it exists)
      guild.roles.fetch().then(async roles => {
        let role = roles.cache.find(role => role.name === args[0]);
        // If role doesn't exist, make it
        if (!role) {
          role = await guild.roles.create({
            data: {
              name: args[0],
              color: 'RANDOM'
            },
            reason: `Create Class ${args[0]}`
          });
        }
        client.db.prepare("INSERT INTO Class (Guild, Name, RoleID) VALUES (?, ?, ?)").run(
          guild.id, args[0], role.id
        );

        const embed = client.genBotEmbed("Create Class");
        embed.addFields([
          {
            name: "Class Created",
            value: "Your class was successfuly created!"
          },
          {
            name: "Role",
            value: role.toString()
          }
        ]);
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
      });
    }
  },
  {
    name: "delclass",
    desc: "Delete a class",
    args: "<name>",
    can_run: (message, _client) => {
      if (message.member)
        return message.member.hasPermission("MANAGE_ROLES");
      return false;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      if (!guild || !args[0])
        return;

      const course = client.db.prepare("SELECT * FROM Class WHERE (Guild=? AND Name=?)").get(
        guild.id, args[0]
      );

      guild.roles.fetch(course.RoleID).then(role => {
        if (role)
          role.delete('Del Class');
        
          client.db.prepare("DELETE FROM Class WHERE (Guild=? AND Name=?)").run(
          course.Guild, course.Name
        );

        const embed = client.genBotEmbed();
        embed.addField(
          'Del Class', `Successfully deleted ${course.Name}`
        );
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
      });
    }
  },
  {
    name: "register",
    desc: "Adds you to the student database.",
    args: "<...name>",
    can_run: (_message, _client) => {
      return true;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      const author = message.member;
      if (!guild || !author)
        return;

      // Let students enter their name
      let name: string = "";
      args.forEach(arg => {name = name.concat(arg + " ");})

      // Check if student exists
      const student = client.db.prepare("SELECT * FROM Student WHERE UserID=?").get(author.id);
      if (student)
        client.db.prepare("UPDATE Student SET Name=? WHERE UserID=?").run(name, author.id);
      else
        client.db.prepare("INSERT INTO Student (UserID, Name) VALUES (?, ?)").run(author.id, name);
      const embed = client.genBotEmbed("Register").addField(
        "Success",
        `Registered ${(name == "" ? " new student" : name )} (${author.id})`
      );
      message.channel.send(embed).catch(err => {
        message.author.send(embed).catch(err2 => {
          log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
        });
      });
    }
  },
  {
    name: "dropout",
    desc: "Remove yourself from the student database",
    args: "",
    can_run: (_message, _client) => {
      return true;
    },
    run: async (message, _args, client) => {
      const guild = message.guild;
      const author = message.member;
      if (!guild || !author)
        return;

      client.db.prepare("DELETE FROM Student WHERE UserID=?").run(author.id);
      const embed = client.genBotEmbed("Drop Out").addField(
        "Success",
        "If you were registered, you have been removed. Thanks for using my services!"
      );
      message.channel.send(embed).catch(err => {
        message.author.send(embed).catch(err2 => {
          log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
        });
      });
    }
  },
  {
    name: "tutorclass",
    desc: "Toggles you as a tutor for 'class'. School-affiliated tutors are considered 'Official'",
    args: "<class> (Official: True/False)",
    can_run: (_message, _client) => {
      return true;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      const author = message.member;
      if (!guild || !author || !args[0])
        return;

      // Check if class exists
      const course = client.db.prepare("SELECT Guild, Name FROM Class WHERE Guild=? AND Name=?").get(
        guild.id, args[0]
      );
      if (course)
      {
        const embed = client.genBotEmbed('Tutor Class');
        // If the student already tutors this class
        if (client.db.prepare("SELECT * FROM Tutors_Class WHERE StudentID=? AND ClassGuild=? AND ClassName=?").get(
          author.id, guild.id, args[0]
        ))
        {
          // Clear from DB
          client.db.prepare("DELETE FROM Tutors_Class WHERE StudentID=? AND ClassGuild=? AND ClassName=?").run(
            author.id, guild.id, args[0]
          );
          embed.addField(
            'Success', `You are no longer a tutor for ${course.Name}`
          );
        } else {
          try {
            client.db.prepare("INSERT INTO Tutors_Class (StudentID, ClassGuild, ClassName, IsOfficial) VALUES (?, ?, ?, ?)").run(
              author.id,
              course.Guild,
              course.Name,
              (args.length > 1 && args[1].toLowerCase() == "true" ? 1 : 0)
            );
            embed.addField(
              'Success', `You are now a tutor for ${course.Name}`
            );
          } catch (err) {
            if (err.name === "SqliteError" && err.message === "FOREIGN KEY constraint failed")
              embed.addField("Error", "You aren't registered as a student. Use the student register command");
            else
              throw err;
          }
        }
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
      } else {
        const embed = client.genBotEmbed("Create Class");
        embed.addField(
          'Error', 'That class doesn\'t exists!'
        );
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }
    }
  },
  {
    name: "tutors",
    desc: "List the tutors for a class",
    args: "<class>",
    can_run: (_message, _client) => {
      return true;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      if (!guild || args.length < 1)
        return;

      const embed = client.genBotEmbed('Tutors');

      // Check if class exists
      const course = client.db.prepare("SELECT Guild, Name FROM Class WHERE Guild=? AND Name=?").get(
        guild.id, args[0]
      );
      if (!course) {
        embed.addField('Error', 'That class doesn\'t exist');
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      const tutors = client.db.prepare("SELECT StudentID, IsOfficial FROM Tutors_Class WHERE ClassGuild=? AND ClassName=?")
        .all(guild.id, course.Guild, course.Name)
      ;
      if (tutors.length == 0) {
        embed.addField('No Tutors', `There are currently no tutors for ${course.Name}`);
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }
      let fields: EmbedFieldData[] = [];
      tutors.forEach(tutor => {
        const tutor_info = client.db.prepare("SELECT * FROM Student WHERE UserID=?").get(
          tutor.StudentID
        );
        const member = guild.members.fetch(tutor.StudentID);
        if (!tutor_info || !member)
          return;
        
        fields.push({
          name: tutor_info.Name, 
          value: `${member.toString()} ${tutor.IsOfficial ? 'Tutor' : 'Helper'}`
        });
      });

      // Flush fields to user
      while (fields.length > 20) {
      embed.addFields(fields.slice(0, 21));
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
      }
      if (fields.length > 0) {
        embed.addFields(fields);
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
      }
    }
  },
  {
    name: "creategroup",
    desc: "Create a study or tutor group", 
    args: "<class> <group_name> (max)",
    can_run: (_message, _client) => {
      return true;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      const author = message.member;
      if (!guild || !author || args.length < 2)
        return;

      const embed = client.genBotEmbed("Create Group");

      args[1] = args[1].toLowerCase();
      if (args[1].length > 20) {
        args[1] = args[1].substring(0, 21);
        embed.addField(
          "Warning",
          "Group name was greater than 20 characters. Chopping name"
        );
      }
      
      const course = client.db.prepare("SELECT * FROM Class WHERE (Guild=? AND Name=?)").get(
        guild.id, args[0]
      );
      if (!course) {
        embed.addField("Error", "That class doesn't exist!");
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }
      
      const max = (args.length > 2 ? parseInt(args[2]) : NaN );

      // Make sure group doesn't exist
      if (client.db.prepare("SELECT * FROM ClassGroup WHERE ID=? AND ClassGuild=? AND ClassName=?").get(
        args[1], course.Guild, course.Name
      ))
      {
        embed.addField(
          "Error", "That group already exists!"
        );
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      // Make the class category (or fetch if it exists)
      let category = guild.channels.cache.find(ch => (ch.name === `GroupFinder Groups`) && (ch.type === "category"));
      if (!category) {
        category = await guild.channels.create(`${course.Name} Groups`, {
          type: 'category',
        });
      }

      // Make the group channel (or fetch if it exists)
      let ch = guild.channels.cache.find(ch => 
        (ch.name === `${course.Name.toLowerCase()}-${args[1]}`) &&
        (ch.type === "text") &&
        (ch.parent === category)
      );
      if (!ch) {
        ch = await guild.channels.create(`${course.Name}-${args[1]}`, {
          type: 'text',
          parent: category,
        });
      }

      // Make the group role (or fetch if it exists)
      guild.roles.fetch().then(async roles => {
        let role = roles.cache.find(role => role.name === `${course.Name}-${args[1]}`);
        // If role doesn't exist, make it
        if (!role) {
          role = await guild.roles.create({
            data: {
              name: `${course.Name}-${args[1]}`,
              color: 'RANDOM'
            },
            reason: `Create Group ${course.Name}-${args[1]}`
          });
        }

        category!.overwritePermissions([
          {
            id: guild.roles.everyone,
            allow: 117824
          },
          {
            id: (client.user ? client.user.id : DEV_ID),
            allow: 117824,
          },
          {
            id: author.id,
            allow: 117840 // https://discordapi.com/permissions.html#117840
          }
        ]);
        ch!.overwritePermissions([
          {
            id: role.id,
            allow: 117824 // https://discordapi.com/permissions.html#117824
          },
          {
            id: guild.roles.everyone,
            deny: 117824
          },
          {
            id: (client.user ? client.user.id : DEV_ID),
            allow: 117824,
          },
          {
            id: author.id,
            allow: 117840 // https://discordapi.com/permissions.html#117840
          }
        ]);

        client.db.prepare("INSERT INTO ClassGroup (ID, ClassGuild, ClassName, ChannelID, RoleID, MaxMembers)\
          VALUES (?, ?, ?, ?, ?, ?)").run(
            args[1], course.Guild, course.Name, ch!.id, role!.id, (max !== NaN ? max : null)
          );
        
        embed.addField(
          "Success",
          `Created Group ${args[1]} for ${course.Name}`
        );

        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
      });
    }
  },
  {
    name: "findgroup",
    desc: "Find a study group for the given class.",
    args: "<class>",
    can_run: (_message, _client) => {
      return true;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      const author = message.author;
      if (!guild || !author || args.length < 1)
        return;

      const embed = client.genBotEmbed("Find Group");

      const course = client.db.prepare("SELECT * FROM Class WHERE (Guild=? AND Name=?)").get(
        guild.id, args[0]
      );
      if (!course) {
        embed.addField("Error", "That class doesn't exist!");
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      let groups = client.db.prepare("SELECT * FROM ClassGroup WHERE ClassName=? AND ClassGuild=?").all(
        args[0], guild.id
      );
      // No groups exist
      if (groups.length === 0) {
        embed.addField(
          "Error", "There are currently no groups for that class!"
        );
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      let fields: EmbedFieldData[] = [];
      for (var group of groups) {
        let msg = (group.MaxMembers ?
          `Limited to ${group.MaxMembers}, so they may be full! ` :
          "This group may be open! "
        );
        const role = await guild.roles.fetch(group.RoleID);
        if (role)
          msg = msg.concat(`Check members for ${role.toString()}`);
        fields.push({
          name: group.ID,
          value: msg
        });
      }

      // Flush fields to user
      while (fields.length > 20) {
        embed.addFields(fields.slice(0, 21));
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
      }
      if (fields.length > 0) {
        embed.addFields(fields);
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
      }
    }
  },
  {
    name: "joingroup",
    desc: "Join a class group",
    args: "<class> <group>",
    can_run: (_message, _client) => {
      return true;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      const author = message.member;
      if (!guild || !author || args.length < 2)
        return;

      const embed = client.genBotEmbed("Join Group");

      const course = client.db.prepare("SELECT Guild, Name FROM Class WHERE Guild=? AND Name=?").get(
        guild.id, args[0]
      );
      if (!course) {
        embed.addField(
          'Error',
          'That class doesn\'t exist!'
        );
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      const group = client.db.prepare("SELECT * FROM ClassGroup WHERE ID=? AND ClassGuild=? AND ClassName=?").get(
        args[1].toLocaleLowerCase(), course.Guild, course.Name
      );
      if (!group) {
        embed.addField(
          'Error',
          'That group doesn\'t exist!'
        );
        message.channel.send(embed).catch(err => {
          log(err, 'WARN');
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      let role = await guild.roles.fetch(group.RoleID);
      if (!role) {
        embed.addField('Error', 'Could not find group role. Group will be deleted.');
        client.db.prepare("DELETE FROM ClassGroup WHERE ID=? AND ClassGuild=? AND ClassName=?")
          .run(group.ID, course.Guild, course.Name)
        ;
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      if (client.db.prepare("SELECT * FROM Member_Of\
        WHERE StudentID=? AND GroupID=? AND ClassGuild=? AND ClassName=?").get(
          author.id, group.ID, course.Guild, course.Name
        )
      )
      {
        client.db.prepare("DELETE FROM Member_Of\
        WHERE StudentID=? AND GroupID=? AND ClassGuild=? AND ClassName=?").run(
          author.id, group.ID, course.Guild, course.Name
        );
        author.roles.remove(role.id, `User left Group ${course.Name}-${group.ID}`);
        embed.addField("Success", "You were a member already, so you were removed.");
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }
      
      const members = client.db.prepare("SELECT StudentID FROM Member_Of WHERE GroupID=? AND ClassGuild=? AND ClassName=?")
        .all(group.ID, course.Guild, course.Name)
      ;

      if (group.MaxMembers && members.length > group.MaxMembers)
        embed.addField('Error', 'That group is full!');
      else {
        author.roles.add(role.id, `User joined Group ${course.Name}-${group.ID}`);

        try {
          client.db.prepare("INSERT INTO Member_Of\
            (StudentID, GroupID, ClassGuild, ClassName) VALUES (?, ?, ?, ?)").run(
              author.id, group.ID, course.Guild, course.Name
            );

          embed.addField("Success", `You succesffully joined ${course.Name}-${group.ID}`);
        } catch (err) {
          if (err.name === "SqliteError" && err.message === "FOREIGN KEY constraint failed")
            embed.addField("Error", "You aren't registered as a student. Use the student register command");
          else
            throw err;
        }
      }

      message.channel.send(embed).catch(err => {
        message.author.send(embed).catch(err2 => {
          log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
        });
      });
    }
  },
  {
    name: "tutorgroup",
    desc: "Become the tutor for a group",
    args: "<class> <group> (Official: True/False)",
    can_run: (_message, _client) =>  {
      return true;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      const author = message.member;
      if (!guild || !author || args.length < 2)
        return;

      args[1] = args[1].toLowerCase();

      const embed = client.genBotEmbed('Tutor Group');

      // Check if class exists
      const course = client.db.prepare("SELECT Guild, Name FROM Class WHERE Guild=? AND Name=?").get(
        guild.id, args[0]
      );
      if (!course) {
        embed.addField(
          'Error', 'That class doesn\'t exists!'
        );
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      const group = client.db.prepare("SELECT * FROM ClassGroup WHERE ID=? AND ClassGuild=? AND ClassName=?").get(
        args[1].toLocaleLowerCase(), course.Guild, course.Name
      );
      if (!group) {
        embed.addField(
          'Error', 'That group doesn\'t exists!'
        );
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      let role = await guild.roles.fetch(group.RoleID);
      if (!role) {
        embed.addField('Error', 'Could not find group role. Group will be deleted.');
        client.db.prepare("DELETE FROM ClassGroup WHERE ID=? AND ClassGuild=? AND ClassName=?")
          .run(group.ID, course.Guild, course.Name)
        ;
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
        return;
      }

      // If the student already tutors the group
      if (client.db.prepare("SELECT * FROM Tutors_Group\
        WHERE StudentID=? AND GroupID=? AND ClassGuild=? AND ClassName=?").get(
          author.id, group.ID, course.Guild, course.Name
        )
      )
      {
        // Clear from DB
        client.db.prepare("DELETE FROM Tutors_Group\
          WHERE StudentID=? AND GroupID=? AND ClassGuild=? AND ClassName=?").run(
            author.id, group.ID, course.Guild, course.Name
          )
        ;
        author.roles.remove(role.id);
        embed.addField(
          'Success', `You are no longer a tutor for ${course.Name}-${group.ID}`
        );
      } else {
        try {
          client.db.prepare("INSERT INTO Tutors_Group (StudentID, GroupID, ClassGuild, ClassName, IsOfficial) VALUES (?, ?, ?, ?, ?)").run(
            author.id,
            group.ID,
            course.Guild,
            course.Name,
            (args.length > 2 && args[2].toLowerCase() == "true" ? 1 : 0)
          );
          author.roles.add(role.id);
          embed.addField(
            'Success', `You are now a tutor for ${course.Name}`
          );
        } catch (err) {
          if (err.name === "SqliteError" && err.message === "FOREIGN KEY constraint failed")
            embed.addField("Error", "You aren't registered as a student. Use the student register command");
          else
            throw err;
        }
      }
      message.channel.send(embed).catch(err => {
        message.author.send(embed).catch(err2 => {
          log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
        });
      });
    }
  },
  {
    name: "professor", 
    desc: "Save or update professor information",
    args: "<first_name> <last_name> <email>",
    can_run: (message, _client) => {
      if (message.member)
        return message.member.hasPermission("MANAGE_ROLES");
      return false;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      const author = message.member;
      if (!guild || !author || args.length < 3)
        return;

      const embed = client.genBotEmbed("Professor Registration")

      // If professor exists
      if (client.db.prepare("SELECT * FROM Professor WHERE UserID=?").get(author.id)) {
        client.db.prepare("UPDATE Professor SET Name=?, Email=? WHERE UserID=?")
          .run(args[0] + " " + args[1], args[2], author.id)
        ;
        embed.addField("Success", "Your information was updated.");
      } else {
        client.db.prepare("INSERT INTO Professor (UserID, Name, Email) VALUES (?, ?, ?)")
          .run(author.id, args[0], args[1])
        ;
        embed.addField("Success", "Your information was saved.");
      }
      message.channel.send(embed).catch(err => {
        message.author.send(embed).catch(err2 => {
          log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
        });
      });
    }
  },
  {
    name: "saveoffice",
    desc: "Save office hours for student reference",
    args: "<office_name> <...info>",
    can_run: (message, _client) => {
      if (message.member)
        return message.member.hasPermission("MANAGE_ROLES");
      return false;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      const author = message.member;
      if (!guild || !author || args.length < 2)
        return;

      let info = "";
      args.slice(1).forEach(arg => {
        info = info.concat(arg + " ");
      });
      const embed = client.genBotEmbed("Save Office");

      if (client.db.prepare("SELECT * FROM Office WHERE ProfessorID=? AND Office=?").get(
        author.id, args[0]
      ))
      {
        client.db.prepare("UPDATE Office SET Info=? WHERE ProfessorID=? AND Office=?").run(
          info, author.id, args[0]
        );
        embed.addField('Success', 'Updated office information.');
      } else {
        try {
          client.db.prepare("INSERT INTO Office (ProfessorID, Office, Info)\
            VALUES (?, ?, ?)").run(
              author.id, args[0], info
            )
          ;
          embed.addField('Success', 'Saved office information.');
        } catch (err) {
          if (err.name === "SqliteError" && err.message === "FOREIGN KEY constraint failed")
            embed.addField("Error", "You aren't a registered professor!");
          else
            throw err;
        }
      }
      
      message.channel.send(embed).catch(err => {
        message.author.send(embed).catch(err2 => {
          log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
        });
      });
    }
  },
  {
    name: "searchprofessor",
    desc: "Fetch a professor's email and office hours by last name",
    args: "<last_name>",
    can_run: (_message, _client) => {
      return true;
    },
    run: async (message, args, client) => {
      const guild = message.guild;
      if (!guild || args.length < 1)
        return;

      const embed = client.genBotEmbed("Search Professor");

      const prof = client.db.prepare("SELECT * FROM Professor WHERE INSTR(LOWER(NAME), ?)")
        .get(args[0].toLowerCase())
      ;
      if (!prof) {
        embed.addField('Error', 'That professor doesn\'t exist!');
        message.channel.send(embed).catch(err => {
          message.author.send(embed).catch(err2 => {
            log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
          });
        });
      }

      if (prof.Email)
        embed.addField('Email', prof.Email);

      const offices = client.db.prepare("SELECT * FROM Office WHERE ProfessorID=?")
        .all(prof.UserID)
      ;
      if (offices.length == 0)
        embed.addField('Offices', 'This professor has no office information saved');
      offices.forEach((office, ind) => {
        if (ind < 15)
          embed.addField(office.Office, office.Info);
        if (ind == 15)
          embed.addField('Warning', 'This professor has more than 15 different offices registered.');
      });

      message.channel.send(embed).catch(err => {
        message.author.send(embed).catch(err2 => {
          log(`Failed to send message. Errors below\n${err}\n${err2}`, 'WARN');
        });
      });
    }
  }
];

const SQL = {
  // Creates the database tables
  CREATE: [
    "CREATE TABLE IF NOT EXISTS Professor (\
      UserID varchar(255) NOT NULL,\
      Name varchar(255) NOT NULL,\
      Email varchar(255),\
      PRIMARY KEY (UserID)\
    );",
    "CREATE TABLE IF NOT EXISTS Office (\
      ProfessorID varchar(255) NOT NULL REFERENCES Professor(UserID),\
      Office varchar(255) UNIQUE NOT NULL,\
      Info varchar(255),\
      PRIMARY KEY (ProfessorID, Office)\
    );",
    "CREATE TABLE IF NOT EXISTS Class (\
      Guild varchar(255) NOT NULL,\
      Name varchar(255) NOT NULL,\
      RoleID varchar(255),\
      PRIMARY KEY (Guild, Name)\
    );",
    "CREATE TABLE IF NOT EXISTS ClassGroup (\
      ID varchar(255) NOT NULL,\
      ClassGuild varchar(255) NOT NULL,\
      ClassName varchar(255) NOT NULL,\
      ChannelID varchar(255),\
      RoleID varchar(255),\
      MaxMembers int,\
      FOREIGN KEY (ClassGuild, ClassName)\
        REFERENCES Class(Guild, Name),\
      PRIMARY KEY (ID, ClassGuild, ClassName)\
    );",
    "CREATE TABLE IF NOT EXISTS Student (\
      UserID varchar(255) NOT NULL,\
      Name varchar(255),\
      PRIMARY KEY (UserID)\
    );",
    "CREATE TABLE IF NOT EXISTS Tutors_Group (\
      StudentID varchar(255) UNIQUE NOT NULL REFERENCES Student(UserID),\
      GroupID varchar(255) UNIQUE NOT NULL,\
      ClassGuild varchar(255) UNIQUE NOT NULL,\
      ClassName varchar(255) UNIQUE NOT NULL,\
      IsOfficial int(1),\
      FOREIGN KEY (GroupID, ClassGuild, ClassName)\
        REFERENCES ClassGroup(ID, ClassGuild, ClassName),\
      PRIMARY KEY (StudentID, GroupID, ClassGuild, ClassName)\
    );",
    "CREATE TABLE IF NOT EXISTS Tutors_Class (\
      StudentID varchar(255) UNIQUE NOT NULL REFERENCES Student(UserID),\
      ClassGuild varchar(255) UNIQUE NOT NULL,\
      ClassName varchar(255) UNIQUE NOT NULL,\
      IsOfficial int(1),\
      FOREIGN KEY (ClassGuild, ClassName)\
        REFERENCES Class(Guild, Name),\
      PRIMARY KEY (StudentID, ClassGuild, ClassName)\
    );",
    "CREATE TABLE IF NOT EXISTS Member_Of (\
      StudentID varchar(255) NOT NULL REFERENCES Student(UserID),\
      GroupID varchar(255) NOT NULL,\
      ClassGuild varchar(255) NOT NULL,\
      ClassName varchar(255) NOT NULL,\
      FOREIGN KEY (GroupID, ClassGuild, ClassName)\
        REFERENCES ClassGroup(ID, ClassGuild, ClassName),\
      PRIMARY KEY (StudentID, GroupID, ClassGuild, ClassName)\
    );"
  ],
  INSERT: [
    "INSERT INTO Professor (UserID, Name, Email) VALUES\
    ('1', 'San Yeung', 'coolprofessor@umsystem.edu'),\
    ('2', 'Michael Gosnell', 'alsocool@umsystem.edu'),\
    ('3', 'Dr. Morales', 'prettycool@umsystem.edu')",
    "INSERT INTO Office (ProfessorID, Office, Info) VALUES\
    ('1', 'CS101', 'MWF 1-5PM'),\
    ('2', 'CS430', 'TTh 12-3PM'),\
    ('3', 'CS115', 'MWF 5-9AM')",
  ]
};