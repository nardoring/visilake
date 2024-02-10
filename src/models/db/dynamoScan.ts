export interface DynamoScan<T> {
  Items: T[];
  Count: number;
  ScannedCount: number;
}
