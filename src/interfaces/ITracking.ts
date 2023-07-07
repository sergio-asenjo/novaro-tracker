import { WithId, Document } from "mongodb";

export interface ITracking extends WithId<Document> {
  id: number;
  itemName?: string;
  uuid: string;
  wantedPrice: number;
  lastNotification?: {
    price: number;
    mapCoords: string;
  };
}