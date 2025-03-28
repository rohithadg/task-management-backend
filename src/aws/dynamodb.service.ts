import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';

interface PaginatedItems<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, string>;
}

export class DynamoDbService {
  constructor(private readonly dynamoDBDocClient: DynamoDBDocumentClient) {}

  async paginatedScan<T extends Record<string, any>>(
    tableName: string,
    partitionKey: string = 'id',
    limit: number = 10,
    lastEvaluatedKey?: string,
  ): Promise<PaginatedItems<T>> {
    const params: ScanCommandInput = {
      TableName: tableName,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey ? { [partitionKey]: lastEvaluatedKey } : undefined,
    };

    const command = new ScanCommand(params);
    const result: ScanCommandOutput = await this.dynamoDBDocClient.send(command);

    return {
      items: result.Items as T[],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  async getItemById<T extends Record<string, any>>(tableName: string, id: string): Promise<T> {
    const command = new GetCommand({
      TableName: tableName,
      Key: { id },
    });

    const item = await this.dynamoDBDocClient.send(command);

    return item.Item as T;
  }

  async putItem(tableName: string, item: Record<string, any>): Promise<void> {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });

    await this.dynamoDBDocClient.send(command);
  }

  async deleteItem(tableName: string, id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: { id },
    });

    await this.dynamoDBDocClient.send(command);
  }
}
