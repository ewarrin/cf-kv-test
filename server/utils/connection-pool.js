/**
 * Connection pooling for KV operations
 */

export class KVConnectionPool {
    constructor(maxConnections = 10) {
        this.maxConnections = maxConnections;
        this.connections = [];
        this.activeConnections = 0;
        this.waitingQueue = [];
    }

    async getConnection() {
        return new Promise((resolve) => {
            if (this.activeConnections < this.maxConnections) {
                this.activeConnections++;
                resolve(this.createConnection());
            } else {
                this.waitingQueue.push(resolve);
            }
        });
    }

    releaseConnection(connection) {
        this.activeConnections--;
        if (this.waitingQueue.length > 0) {
            const resolve = this.waitingQueue.shift();
            this.activeConnections++;
            resolve(this.createConnection());
        }
    }

    createConnection() {
        return {
            id: Math.random().toString(36).substr(2, 9),
            createdAt: Date.now(),
            release: () => this.releaseConnection(this),
        };
    }

    getStats() {
        return {
            active: this.activeConnections,
            waiting: this.waitingQueue.length,
            max: this.maxConnections,
        };
    }
}

export const kvPool = new KVConnectionPool();
