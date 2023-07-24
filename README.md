A simple FIFO queue that limits memory usage

It's designed to be used in case when we want to postpone item consumption but at the same time limiting memory usage.

Consider 2 scenarios:

1. Memory limit is not reached

```typescript
async function run() {
  const queue = new MemSavvyQueue<Uint32Array>({
    memoryUsageLimitBytes: 1200,
    itemConsumer: async (item) => {
      console.log("Consuming item %d", item[0]);
      return Promise.resolve();
    },
  });

  for (let i = 0; i < 3; i++) {
    await queue.push(new Uint32Array(100).fill(i));
    console.log("Added item %d", i);
  }

  console.log("Consuming all items");
  await queue.consumeAll();
}

run().then(() => console.log("Done"));
```

output would be:

```
Added item 0
Added item 1
Added item 2
Consuming all items
Consuming item 0
Consuming item 1
Consuming item 2
Done
```

As we can see, when there is no memory pressure, our queue acts like a buffer allowing us to consume stored items at our own pace.

2. Memory limit is exceeded

```typescript
async function run() {
  const queue = new MemSavvyQueue<Uint32Array>({
    memoryUsageLimitBytes: 800,
    itemConsumer: async (item) => {
      console.log("Consuming item %d", item[0]);
      return Promise.resolve();
    },
  });

  for (let i = 0; i < 5; i++) {
    await queue.push(new Uint32Array(100).fill(i));
    console.log("Added item %d", i);
  }

  console.log("Consuming all items");
  await queue.consumeAll();
}

run().then(() => console.log("Done"));
```

output would be:

```
Added item 0
Added item 1
Consuming item 0
Added item 2
Consuming item 1
Added item 3
Consuming item 2
Added item 4
Consuming all items
Consuming item 3
Consuming item 4
Done
```

In this case we exceeded defined memory limit at some point, and queue started calling `itemConsumer` on the "oldest" items to free up memory required to store new item.

## API

```typescript
export type MemSavvyQueueConfig<ITEM> = {
  // consumer function
  itemConsumer: (item: ITEM) => Promise<void>;
  // memory usage limit in bytes (default = 1Mb)
  memoryUsageLimitBytes?: number;
};

export class MemSavvyQueue<ITEM> {
  constructor(config: MemSavvyQueueConfig<ITEM>);

  // push new item - returns number of forcefully consumed items
  public async push(item: ITEM): Promise<number>;

  // consume one oldest item - returns true if item was consumed
  public async consumeOne(): Promise<boolean>;

  // consume all items - returns number of consumed items
  public async consumeAll(): Promise<number>;

  // returns item count
  public getCount(): number;

  // returns true if there are some items
  public hasItems(): boolean;
}
```
