type Constructor<T = any> = new (...args: any[]) => T;

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, any>();

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service not found for key: ${key}`);
    }
    return service as T;
  }

  clear(): void {
    this.services.clear();
  }
}

export const container = ServiceContainer.getInstance();
