export interface IRepository<T> {
	getOne: (id: string) => Promise<T | null>;
	getAll: () => Promise<T[]>;
	create: (data: Partial<T>) => Promise<T>;
	update: (id: string, data: Partial<T>) => Promise<T>;
	delete: (id: string) => Promise<any>;
	// getByOptions: (options: Partial<T>) => Promise<T[]>;
}
