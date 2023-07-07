import { ObjectId } from "mongodb";
import { ITracking } from "./interfaces/ITracking";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { formatPrice, listTrackedItems } from "./utils";
import { BDService } from "./bd";

const bdService = new BDService();

export class Bot {
  private _client: Client;

  constructor() {
    this._client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.login(process.env.DISCORD_TOKEN!);
  }

  private async login(token: string): Promise<void> {
    await this._client.login(token);
    await this.setGuildCommands(process.env.SERVER_ID!);
    await this.onCommand();
  }

  private async setGuildCommands(id: string) {
    const guild = this._client.guilds.cache.get(id);
    if (!guild) return;

    const commands = guild.commands;

    await commands.create({
      name: "track",
      description: "Starts tracking the price of an item via its ID, or updates the price of an already tracked one.",
      options: [
        {
          name: "id",
          description: "ID corresponding to the item.",
          required: true,
          type: 4,
        },
        {
          name: "price",
          description: "The price <= that you want to be notified about.",
          required: true,
          type: 4,
        },
      ],
    });

    await commands.create({
      name: "untrack",
      description: "Stop tracking an item via its ID.",
      options: [
        {
          name: "id",
          description: "ID corresponding to the item.",
          required: true,
          type: 4,
        },
      ],
    });

    await commands.create({
      name: "tracked",
      description: "Shows the items that you are tracking.",
    });
  }

  private async onCommand() {
    this._client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) return;

      const { commandName } = interaction;

      if (commandName === "track") {
        const id = interaction.options.get("id")?.value as number;
        const wantedPrice = interaction.options.get("price")?.value as number;
        const uuid = interaction.user.id;
        const newTrackedItem: ITracking = {
          _id: new ObjectId(),
          id,
          uuid,
          wantedPrice,
        };
        const bdResponse = await bdService.insertTrackedItem(newTrackedItem);
        if (bdResponse) {
          await interaction.reply({
            content: `Tracking item with ID ${id}, and getting notifications when prices are lower or equal to ${formatPrice(
              wantedPrice
            )}z.`,
            ephemeral: true,
          });
        }

      } else if (commandName === "untrack") {
        const id = interaction.options.get("id")?.value as number;
        const uuid = interaction.user.id;
        const bdResponse = await bdService.deleteTrackedItem(id, uuid);
        if (bdResponse) {
          await interaction.reply({
            content: `Untracking item with ID ${id}.`,
            ephemeral: true,
          });
        }
      } else if (commandName === "tracked") {
        const uuid = interaction.user.id;
        const bdResponse = await bdService.getTrackedItems(uuid);
        if (bdResponse) {
          const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Tracked Items")
            .setDescription(
              listTrackedItems(bdResponse)
            );
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }
    });
  }

  public async sendAlert(
    uuid: string,
    itemName: string,
    currentPrice: number,
    itemId: number,
    mapPos: string
  ): Promise<void> {
    if (await bdService.checkIfAlertWasSent(uuid, itemId, currentPrice, mapPos))
      return;
    const embed = this.createEmbed(
      itemName,
      itemId,
      formatPrice(currentPrice),
      mapPos
    );
    await (await this._client.users.fetch(`${uuid}`)).send({ embeds: [embed] });
    await bdService.updateTrackedWithNotificacion(
      currentPrice,
      mapPos,
      uuid,
      itemId
    );
  }

  private createEmbed(
    itemName: string,
    itemId: number,
    currentPrice: string,
    mapPos: string
  ) {
    return new EmbedBuilder()
      .setColor(0x0099ff)
      .setURL(
        `https://www.novaragnarok.com/?module=vending&action=item&id=${itemId}`
      )
      .setAuthor({
        name: `${itemName}`,
        iconURL: `https://www.novaragnarok.com/data/items/icons2/${itemId}.png`,
        url: `https://www.novaragnarok.com/?module=vending&action=item&id=${itemId}`,
      })
      .setThumbnail(
        `https://www.novaragnarok.com/data/items/images2/${itemId}.png`
      )
      .addFields(
        {
          name: "Current Lower Price",
          value: `${currentPrice}z`,
          inline: false,
        },
        {
          name: "Map Navigation",
          value: `${mapPos}`,
          inline: false,
        },
        {
          name: "Open Stall",
          value: `@ws ${itemId}`,
        }
      );
  }
}
