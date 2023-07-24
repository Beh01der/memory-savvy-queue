// node --trace_gc ./dist/index.js

import sizeof from "object-sizeof";

export type MemSavvyQueueConfig<ITEM> = {
  itemConsumer: (item: ITEM) => Promise<void>;
  memoryUsageLimitBytes?: number;
};

export class MemSavvyQueue<ITEM> {
  private items: ITEM[] = [];
  private usedMemory = 0;
  private config: Required<MemSavvyQueueConfig<ITEM>>;

  constructor(config: MemSavvyQueueConfig<ITEM>) {
    this.config = {
      memoryUsageLimitBytes: 1 * 1024 * 1024,
      ...config,
    };
  }

  public async push(item: ITEM) {
    const itemSize = sizeof(item);
    let consumed = 0;
    if (this.hasMemoryCapacity(itemSize)) {
      this.items.push(item);
      this.usedMemory += itemSize;
    } else {
      while (!this.hasMemoryCapacity(itemSize) && this.hasItems()) {
        await this.consumeOne();
        consumed++;
      }

      if (this.hasMemoryCapacity(itemSize)) {
        this.push(item);
      } else {
        await this.config.itemConsumer(item);
      }
    }

    return consumed;
  }

  public async consumeOne() {
    const item = this.items.shift();
    if (item) {
      await this.config.itemConsumer(item);
      this.usedMemory -= sizeof(item);
    }

    return !!item;
  }

  public async consumeAll() {
    let consumed = 0;
    while (await this.consumeOne()) {
      consumed++;
    }

    return consumed;
  }

  public getCount() {
    return this.items.length;
  }

  public hasItems() {
    return this.getCount() > 0;
  }

  private hasMemoryCapacity(newItemSize: number) {
    return (newItemSize + this.usedMemory) <= this.config.memoryUsageLimitBytes;
  }
}
