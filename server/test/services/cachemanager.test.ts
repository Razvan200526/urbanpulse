import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { cacheManager } from "@server/services/cache/CacheManager";
import RedisClient from "@server/services/cache/RedisClient";

afterEach(() => {
	mock.restore();
});

describe("CacheManager", () => {
	test("initializes and shuts down through the Redis client singleton", async () => {
		const redisClient = {
			init: mock(async () => undefined),
			cleanup: mock(async function () {
				redisClient.connected = false;
			}),
			connected: true,
		};

		spyOn(RedisClient, "getInstance").mockReturnValue(redisClient as any);

		await cacheManager.init(true);
		expect(redisClient.init).toHaveBeenCalledWith({ required: true });

		await cacheManager.shutdown();
		expect(redisClient.cleanup).toHaveBeenCalled();
		expect(cacheManager.ready).toBe(false);
	});
});
