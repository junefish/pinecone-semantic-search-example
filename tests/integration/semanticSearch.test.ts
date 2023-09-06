import { Pinecone } from '@pinecone-database/pinecone';
import { run } from "@src/index.js";
import { createMockOnProcessExit, randomizeIndexName } from "../utils/index.js";

describe(
  "Semantic Search",
  () => {
    const originalEnv = { ...process.env };
    const originalArgv = { ...process.argv };

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleMock = vi.spyOn(console, "error").mockImplementation(() => {});

    // In case our test fails it will be reruned.
    // We whant to ensure that we are using new index but keep track of previus ones
    // so we are able to clean after tests are done
    const createdIndexes: string[] = [];
    const setIndexName = (name: string) => {
      const indexName = randomizeIndexName(name);
      createdIndexes.push(indexName);
      process.env.PINECONE_INDEX = indexName;
      return indexName;
    };

    afterEach(() => {
      process.argv = originalArgv;
    });

    afterAll(async () => {
      // Delete all created indexes after usage
      await Promise.all(
        createdIndexes.map(async (indexName) => {
          try {
            const pinecone = new Pinecone();
            await pinecone.deleteIndex(indexName);
          } catch (e) {
            console.error(e);
          }
        })
      );

      // Reset mocks
      consoleMock.mockReset();
    });

    it("should be able to load new questions and query them", async () => {
      const indexName = setIndexName(originalEnv.PINECONE_INDEX || "");

      // Set env for indexing
      process.argv = [
        "node",
        "../../src/index",
        "l",
        "--csvPath=tests/data/test_small.csv",
        "--column=question1",
      ];

      await run();

      const pinecone = new Pinecone();
      const index = pinecone.index(indexName);
      const stats = await index
        .describeIndexStats()
        .catch((e) => console.error(e));

      // Ensure that all vectors are added
      expect(stats?.namespaces?.default.recordCount).toBe(4);

      // Set environment for querying
      process.argv = [
        "node",
        "../../src/index",
        "q",
        '--query="which city has the highest population in the world?"',
        "--topK=2",
      ];

      await run();
    });

    it("should exit if index csvPath is empty", async () => {
      const mockExit = createMockOnProcessExit();

      process.argv = [
        "node",
        "../../src/index",
        "l",
        "--csvPath",
        "--column=question1",
      ];

      await expect(run()).rejects.toThrow("process.exit: 1");

      expect(mockExit).toBeCalledWith(1);

      mockExit.mockRestore();
    });

    it("should exit if q is empty in query command", async () => {
      const mockExit = createMockOnProcessExit();

      process.argv = ["node", "../../src/index", "q", "-q", "-k=2"];

      await expect(run()).rejects.toThrow("process.exit: 1");

      expect(mockExit).toBeCalledWith(1);

      mockExit.mockRestore();
    });

    it("should log an error if delte is called without valid index name", async () => {
      setIndexName("some-non-exiting-index");
      process.argv = ["node", "../../src/index", "delete"];

      await run();
      expect(consoleMock).toHaveBeenCalledWith(
        "PineconeError: PineconeClient: Error calling deleteIndex: 404: Not Found"
      );
    });
  },
  // Set timeout to 5 mins, becouse creating index can take time
  5 * 60 * 1000
);
