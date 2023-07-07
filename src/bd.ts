import {
  InsertOneResult,
  MongoClient,
  ServerApiVersion,
  UpdateFilter,
  UpdateResult,
} from "mongodb";
import "dotenv/config";
import { ITracking } from "./interfaces/ITracking";

export class BDService {
  private _MONGODB_URI: string = process.env.MONGODB_URI!;
  private _client: MongoClient = new MongoClient(this._MONGODB_URI, {
    serverApi: ServerApiVersion.v1,
  });
  private _dbName: string = process.env.DB_NAME!;

  public async createConnection(collection: string) {
    try {
      await this._client.connect();
      const database = this._client.db(this._dbName);
      return database.collection(collection);
    } catch (error) {
      console.warn(error);
    }
  }

  public async obtainTrackedItems(): Promise<ITracking[]> {
    try {
      console.debug("Obtaining tracked items");
      const collection = await this.createConnection("tracked");
      return (await collection!.find().toArray()) as ITracking[];
    } catch (error) {
      console.warn(error);
      return [];
    }
  }

  public async insertTrackedItem(
    item: ITracking
  ): Promise<InsertOneResult<Document> | UpdateResult | null> {
    try {
      const collection = await this.createConnection("tracked");
      const exists = await collection!.findOne({
        uuid: item.uuid,
        id: item.id,
      });
      if (exists) {
        return await collection!.updateOne(
          { uuid: item.uuid, id: item.id },
          { $set: { wantedPrice: item.wantedPrice } }
        );
      }
      return await collection!.insertOne(item);
    } catch (error) {
      console.warn(error);
      return null;
    }
  }

  public async updateTrackedWithNotificacion(
    price: number,
    mapCoords: string,
    uuid: string,
    id: number,
  ): Promise<UpdateFilter<Document> | null> {
    try {
      const collection = await this.createConnection("tracked");
      return await collection!.updateOne(
        { uuid: uuid, id: id },
        {
          $set: {
            lastNotification: {
              price,
              mapCoords,
            },
          },
        }
      );
    } catch (error) {
      console.warn(error);
      return null;
    }
  }

  public async updateTrackedItemName(id: number, uuid: string, itemName: string): Promise<boolean> {
    try {
      const collection = await this.createConnection("tracked");
      await collection!.updateOne({ id: id, uuid: uuid }, { $set: { itemName: itemName } });
      return true;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }

  public async checkIfAlertWasSent(uuid: string, id: number, currentLowerPrice: number, mapCoords: string): Promise<boolean> {
    try {
      const collection = await this.createConnection("tracked");
      const item = await collection!.findOne({ uuid: uuid, id: id }) as ITracking;

      if (!item) return false;

      if (
        item.lastNotification?.price === currentLowerPrice
        && item.lastNotification?.mapCoords === mapCoords
      ) return true;

      return false;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }

  public async deleteTrackedItem(id: number, uuid: string): Promise<boolean> {
    try {
      const collection = await this.createConnection("tracked");
      await collection!.deleteOne({ id: id, uuid: uuid });
      return true;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }

  public async getTrackedItems(uuid: string): Promise<ITracking[]> {
    try {
      const collection = await this.createConnection("tracked");
      return (await collection!.find({ uuid: uuid }).toArray()) as ITracking[];
    } catch (error) {
      console.warn(error);
      return [];
    }
  }
}
