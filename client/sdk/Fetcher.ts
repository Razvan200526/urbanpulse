export type FetcherConfigType = {
	baseURL: string;
	headers: Record<string, string>;
	beforeSend?: (config: FetcherConfigType) => FetcherConfigType;
	onServerError?: (message: string) => void;
};

export type FetcherRequestOptionsType = {
	headers?: Record<string, string>;
	signal?: AbortSignal;
};

export class Fetcher {
	private abortController: AbortController;

	constructor(public config: FetcherConfigType) {
		this.config = {
			...config,
			headers: {
				"Content-Type": "application/json",
				...config.headers,
			},
		};
		this.config.baseURL = this.buildURL(config.baseURL);
		this.abortController = new AbortController();
	}

	/**
	 * Set or update configuration
	 */
	public configure(config: Partial<FetcherConfigType>): void {
		this.config = {
			...this.config,
			...config,
			headers: {
				...this.config.headers,
				...config.headers,
			},
		};
	}
	public getHeaders(): Record<string, string> {
		return this.config.headers;
	}
	/**
	 * Set authorization header
	 */
	public setAuthToken(
		token: string,
		type: "Bearer" | "Basic" = "Bearer",
	): void {
		this.config.headers.Authorization = `${type} ${token}`;
	}

	/**
	 * Remove authorization header
	 */
	public clearAuthToken(): void {
		delete this.config.headers.Authorization;
	}

	public clearContentType(): void {
		delete this.config.headers["Content-Type"];
	}

	public setContentType(): void {
		this.config.headers["Content-Type"] = "application/json";
	}

	/**
	 * Abort all pending requests
	 */
	public abort(): void {
		this.abortController.abort();
		// Create a new controller for future requests
		this.abortController = new AbortController();
	}

	/**
	 * Create a new Fetcher instance with the same configuration
	 */
	public clone(): Fetcher {
		return new Fetcher({ ...this.config });
	}

	/**
	 * Make a GET request
	 */
	public async get<T = any>(
		path: string,
		filter?: string,
		options?: FetcherRequestOptionsType,
	): Promise<T> {
		return this.request<T>("GET", path, filter, options);
	}

	/**
	 * Make a POST request
	 */
	public async post<T = any>(
		path: string,
		data?: any,
		options?: FetcherRequestOptionsType,
	): Promise<T> {
		return this.request<T>("POST", path, data, options);
	}

	/**
	 * Make a PUT request
	 */
	public async put<T = any>(
		path: string,
		data?: any,
		options?: FetcherRequestOptionsType,
	): Promise<T> {
		return this.request<T>("PUT", path, data, options);
	}

	/**
	 * Make a PATCH request
	 */
	public async patch<T = any>(
		path: string,
		data?: any,
		options?: FetcherRequestOptionsType,
	): Promise<T> {
		return this.request<T>("PATCH", path, data, options);
	}

	/**
	 * Make a DELETE request
	 */
	public async delete<T = any>(
		path: string,
		data?: any,
		options?: FetcherRequestOptionsType,
	): Promise<T> {
		return this.request<T>("DELETE", path, data, options);
	}

	/**
	 * Make a HEAD request
	 */
	public async head<T = any>(
		path: string,
		options?: FetcherRequestOptionsType,
	): Promise<T> {
		return this.request<T>("HEAD", path, undefined, options);
	}

	/**
	 * Make a generic request
	 */
	public async request<T = any>(
		method: string,
		path: string,
		data?: any,
		options?: FetcherRequestOptionsType,
	): Promise<T> {
		const fullURL = this.buildURL(path);
		const requestOptions = this.buildRequestOptions(method, data, options);
		const response = await fetch(fullURL, requestOptions);
		if (response.status === 401) {
			window.dispatchEvent(new CustomEvent("auth:unauthorized"));
		}
		const responseData = await response.json();

		if (responseData.isServerError) {
			this.config.onServerError?.(responseData.message);
		}

		return responseData;
	}

	/**
	 * Upload a file
	 */
	public async upload<T = any>(
		path: string,
		file: File | Blob,
		name = "file",
		options?: Omit<FetcherRequestOptionsType, "headers"> & {
			headers?: Omit<Record<string, string>, "Content-Type">;
		},
	): Promise<T> {
		const formData = new FormData();
		formData.append(name, file);

		const requestOptions: FetcherRequestOptionsType = {
			...options,
			headers: {
				...options?.headers,
			},
		};

		return this.request<T>("POST", path, formData, requestOptions);
	}

	private buildURL(url: string): string {
		if (url.startsWith("http://") || url.startsWith("https://")) {
			return url;
		}

		// Normalize path to always go through API surface
		let path = url.startsWith("/") ? url : `/${url}`;

		// If the path isn't already API-prefixed, add /api
		if (!path.startsWith("/api/")) {
			path = `/api${path}`;
		}

		const baseURL = this.config.baseURL.endsWith("/")
			? this.config.baseURL.slice(0, -1)
			: this.config.baseURL;

		return `${baseURL}${path}`;
	}

	private buildRequestOptions(
		method: string,
		data?: any,
		options?: FetcherRequestOptionsType,
	): RequestInit {
		const headers = {
			...this.config.headers,
			...options?.headers,
			...(this.config.beforeSend?.(this.config).headers || {}),
		};

		let body: BodyInit | undefined;

		if (data !== undefined && method !== "GET" && method !== "HEAD") {
			if (data instanceof FormData) {
				body = data;
				// Remove Content-Type header for FormData
				delete headers["Content-Type"];
			} else if (typeof data === "string") {
				body = data;
			} else if (data instanceof Blob || data instanceof ArrayBuffer) {
				body = data;
			} else {
				body = JSON.stringify(data);
			}
		}

		// Create a combined controller for instance abort and optional signal
		const combinedController = new AbortController();

		// Listen to instance abort controller
		this.abortController.signal.addEventListener("abort", () => {
			combinedController.abort();
		});

		// Listen to optional provided signal
		if (options?.signal) {
			options.signal.addEventListener("abort", () => {
				combinedController.abort();
			});
		}

		const requestOptions: RequestInit = {
			method,
			headers,
			body,
			signal: combinedController.signal,
			credentials: "include",
		};

		return requestOptions;
	}
}
