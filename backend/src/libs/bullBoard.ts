import { createBullBoard } from "@bull-board/api"
import { BullAdapter } from "@bull-board/api/bullAdapter"
import { ExpressAdapter } from "@bull-board/express"

import { getAllQueues } from "./queues"

export function setupBullBoard(): ExpressAdapter {
  const serverAdapter = new ExpressAdapter()
  serverAdapter.setBasePath("/admin/queues")

  const bullAdapters = getAllQueues().map(queue => new BullAdapter(queue))

  createBullBoard({
    queues: bullAdapters,
    serverAdapter
  })

  return serverAdapter
}
