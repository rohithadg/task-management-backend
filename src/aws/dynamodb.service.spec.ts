import 'aws-sdk-client-mock-jest';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDbService } from './dynamodb.service';

describe('DynamoDbService', () => {
  const mockDynamoDBDocClient = mockClient(DynamoDBDocumentClient);

  const dynamoDbService = new DynamoDbService(
    mockDynamoDBDocClient as unknown as DynamoDBDocumentClient,
  );
  const testTableName = 'TestTable';

  beforeEach(() => {
    mockDynamoDBDocClient.reset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('paginatedScan', () => {
    it('should return paginated items without last evaluated key', async () => {
      const mockItems = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      mockDynamoDBDocClient.on(ScanCommand).resolves({
        Items: mockItems,
        $metadata: {},
      });

      const result = await dynamoDbService.paginatedScan(testTableName);

      expect(result.items).toEqual(mockItems);
      expect(result.lastEvaluatedKey).toBeUndefined();
      expect(mockDynamoDBDocClient.calls()[0].firstArg.input).toEqual({
        TableName: testTableName,
        Limit: 10,
        ExclusiveStartKey: undefined,
      });
    });

    it('should return paginated items with last evaluated key', async () => {
      const mockItems = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];
      const lastEvaluatedKey = '2';

      mockDynamoDBDocClient.on(ScanCommand).resolves({
        Items: mockItems,
        LastEvaluatedKey: { id: lastEvaluatedKey },
        $metadata: {},
      });

      const result = await dynamoDbService.paginatedScan(testTableName, 'id', {
        limit: 10,
        lastKey: lastEvaluatedKey,
      });

      expect(result.items).toEqual(mockItems);
      expect(result.lastEvaluatedKey).toEqual({ id: lastEvaluatedKey });
      expect(mockDynamoDBDocClient.calls()[0].firstArg.input).toEqual({
        TableName: testTableName,
        Limit: 10,
        ExclusiveStartKey: { id: lastEvaluatedKey },
      });
    });
  });

  describe('getItemById', () => {
    it('should retrieve an item by ID', async () => {
      const mockItem = { id: '1', name: 'Test Item' };

      mockDynamoDBDocClient.on(GetCommand).resolves({
        Item: mockItem,
        $metadata: {},
      });

      const result = await dynamoDbService.getItemById(testTableName, '1');

      expect(result).toEqual(mockItem);
      expect(mockDynamoDBDocClient.calls()[0].firstArg.input).toEqual({
        TableName: testTableName,
        Key: { id: '1' },
      });
    });

    it('should return undefined if item not found', async () => {
      mockDynamoDBDocClient.on(GetCommand).resolves({
        Item: undefined,
        $metadata: {},
      });

      const result = await dynamoDbService.getItemById(testTableName, 'non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('putItem', () => {
    it('should successfully put an item', async () => {
      const itemToAdd = { id: '1', name: 'New Item' };

      mockDynamoDBDocClient.on(PutCommand).resolves({
        $metadata: {},
      });

      await expect(dynamoDbService.putItem(testTableName, itemToAdd)).resolves.toBeUndefined();

      expect(mockDynamoDBDocClient.calls()[0].firstArg.input).toEqual({
        TableName: testTableName,
        Item: itemToAdd,
      });
    });
  });

  describe('deleteItem', () => {
    it('should successfully delete an item', async () => {
      mockDynamoDBDocClient.on(DeleteCommand).resolves({
        $metadata: {},
      });

      await expect(dynamoDbService.deleteItem(testTableName, '1')).resolves.toBeUndefined();

      expect(mockDynamoDBDocClient.calls()[0].firstArg.input).toEqual({
        TableName: testTableName,
        Key: { id: '1' },
      });
    });
  });
});
