export interface IRepository<T> {
	getOne: (id: string) => Promise<T | null>;
	getAll: () => Promise<T[]>;
	create: (data: Partial<T>) => Promise<T | null>;
	update: (id: string, data: Partial<T>) => Promise<T>;
	delete: (id: string) => Promise<boolean>;
	// getByOptions: (options: Partial<T>) => Promise<T[]>;
}
