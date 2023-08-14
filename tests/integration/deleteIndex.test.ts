import { utils } from "@pinecone-database/pinecone";
import { getPineconeClient } from "@src/pinecone.js";
import { deleteIndex } from "@src/deleteIndex.js";
import { randomizeIndexName } from "../utils/index.js";

describe("Delete", () => {
  const INDEX_NAME = randomizeIndexName("test-index-for-delete");

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const consoleMock = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(
    async () => {
      process.env.PINECONE_INDEX = INDEX_NAME;

      try {
        const pineconeClient = await getPineconeClient();

        await utils.createIndexIfNotExists(pineconeClient, INDEX_NAME, 384);
      } catch (error) {
        console.error(error);
      }
    }, // Set timeout to 5 mins, becouse creating index can take time
    5 * 60 * 1000
  );

  afterAll(() => {
    consoleMock.mockReset();
  });

  it("should delete Pinecone index", async () => {
    await deleteIndex();

    expect(consoleMock).toHaveBeenCalledWith(`Index is deleted: ${INDEX_NAME}`);
  });
});
