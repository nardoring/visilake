export interface DynamoScan<T> {
  Items: T[];
  Count: Number;
  ScannedCount: Number;
}
