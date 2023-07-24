import { memoryUsage } from "node:process";
import { MemSavvyQueue } from "./index";

const MEMORY_USAGE_LIMIT_BYTES = 10 * 1024 * 1024; // 10MB
const ITEM_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

describe("MemSavvyQueue", () => {
  it("Limits memory usage", async () => {
    await runTest(30);
    const after1 = memoryUsage();

    await runTest(1000);
    const after2 = memoryUsage();

    // memory usage is rougly the same for 30 and 1000 items - difference is less then 1%
    const deltaPercents = Math.abs(after2.heapUsed - after1.heapUsed) / after1.heapUsed * 100;
    expect(deltaPercents).toBeLessThan(1);
  });
});

async function runTest(itemNumber: number) {
  const queue = new MemSavvyQueue<Uint32Array>({
    memoryUsageLimitBytes: MEMORY_USAGE_LIMIT_BYTES,
    itemConsumer: async () => {
      return Promise.resolve();
    },
  });

  const fillQueueConsumeItems = async () => {
    for (let i = 0; i < itemNumber; i++) {
      await queue.push(new Uint32Array(ITEM_SIZE_BYTES));
    }
    await queue.consumeAll();
  };

  await fillQueueConsumeItems();
}
