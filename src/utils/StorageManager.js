/**
 * LOCAL STORAGE MANAGER
 * Quản lý lưu trữ dữ liệu mock data vào localStorage
 */

import { MOCK_DATA } from "./mockData.js";

const STORAGE_KEY = "hian_app_data";

export class StorageManager {
  /**
   * Khởi tạo dữ liệu mock vào localStorage (chỉ chạy lần đầu)
   */
  static initializeMockData() {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) {
      console.log("🔄 Initializing mock data to localStorage...");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
      console.log("✅ Mock data initialized successfully!");
      return true;
    }
    console.log("📦 Mock data already exists in localStorage");
    return false;
  }

  /**
   * Lấy toàn bộ dữ liệu
   */
  static getAllData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : MOCK_DATA;
  }

  /**
   * Lấy một bảng dữ liệu cụ thể
   * @param {string} table - Tên bảng (users, products, orders, etc.)
   */
  static getTable(table) {
    const data = this.getAllData();
    return data[table] || [];
  }

  /**
   * Lấy một record theo ID
   * @param {string} table - Tên bảng
   * @param {number|string} id - ID của record
   * @param {string} idField - Tên field ID (mặc định: 'id')
   */
  static getById(table, id, idField = null) {
    const tableData = this.getTable(table);
    if (!tableData.length) return null;

    // Tự động tìm field ID nếu không được chỉ định
    if (!idField) {
      const firstRecord = tableData[0];
      idField = Object.keys(firstRecord).find((key) => key.includes("_id")) || "id";
    }

    return tableData.find((record) => record[idField] == id) || null;
  }

  /**
   * Lấy nhiều records theo điều kiện
   * @param {string} table - Tên bảng
   * @param {object} conditions - Điều kiện tìm kiếm {field: value}
   */
  static findMany(table, conditions = {}) {
    const tableData = this.getTable(table);
    if (Object.keys(conditions).length === 0) return tableData;

    return tableData.filter((record) => {
      return Object.entries(conditions).every(([key, value]) => record[key] == value);
    });
  }

  /**
   * Thêm record mới
   * @param {string} table - Tên bảng
   * @param {object} record - Dữ liệu record mới
   */
  static add(table, record) {
    const data = this.getAllData();
    const tableData = data[table] || [];

    // Tính auto ID
    const maxId = Math.max(
      ...tableData.map((r) => {
        const idField = Object.keys(r).find((key) => key.includes("_id"));
        return r[idField] || 0;
      }),
      0
    );

    const newRecord = {
      ...record,
      // Tự động thêm ID nếu chưa có
      [Object.keys(record).find((key) => key.includes("_id")) || "id"]: maxId + 1,
      created_at: new Date().toISOString(),
    };

    tableData.push(newRecord);
    data[table] = tableData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    console.log(`✅ Added new record to ${table}:`, newRecord);
    return newRecord;
  }

  /**
   * Cập nhật record
   * @param {string} table - Tên bảng
   * @param {number|string} id - ID record cần cập nhật
   * @param {object} updates - Dữ liệu cập nhật
   * @param {string} idField - Tên field ID
   */
  static update(table, id, updates, idField = null) {
    const data = this.getAllData();
    const tableData = data[table] || [];

    // Tự động tìm field ID
    if (!idField && tableData.length > 0) {
      idField = Object.keys(tableData[0]).find((key) => key.includes("_id")) || "id";
    }

    const index = tableData.findIndex((record) => record[idField] == id);
    if (index === -1) {
      console.warn(`❌ Record not found in ${table} with ID ${id}`);
      return null;
    }

    tableData[index] = {
      ...tableData[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    data[table] = tableData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    console.log(`✅ Updated record in ${table}:`, tableData[index]);
    return tableData[index];
  }

  /**
   * Xoá record
   * @param {string} table - Tên bảng
   * @param {number|string} id - ID record cần xoá
   * @param {string} idField - Tên field ID
   */
  static delete(table, id, idField = null) {
    const data = this.getAllData();
    const tableData = data[table] || [];

    // Tự động tìm field ID
    if (!idField && tableData.length > 0) {
      idField = Object.keys(tableData[0]).find((key) => key.includes("_id")) || "id";
    }

    const index = tableData.findIndex((record) => record[idField] == id);
    if (index === -1) {
      console.warn(`❌ Record not found in ${table} with ID ${id}`);
      return false;
    }

    const deletedRecord = tableData.splice(index, 1)[0];
    data[table] = tableData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    console.log(`✅ Deleted record from ${table}:`, deletedRecord);
    return true;
  }

  /**
   * Xoá tất cả dữ liệu (Reset)
   */
  static clear() {
    localStorage.removeItem(STORAGE_KEY);
    console.log("🔄 All data cleared from localStorage");
  }

  /**
   * Reset về mock data ban đầu
   */
  static resetToMockData() {
    this.clear();
    this.initializeMockData();
  }

  /**
   * Export dữ liệu dưới dạng JSON file
   */
  static exportToFile() {
    const data = this.getAllData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hian_app_data_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log("✅ Data exported to file");
  }

  /**
   * Import dữ liệu từ JSON file
   */
  static importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          console.log("✅ Data imported successfully");
          resolve(data);
        } catch (error) {
          reject(new Error("Invalid JSON file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  /**
   * Lấy thống kê cơ bản
   */
  static getStats() {
    const data = this.getAllData();
    return {
      users: data.users?.length || 0,
      products: data.products?.length || 0,
      orders: data.orders?.length || 0,
      reviews: data.reviews?.length || 0,
      blogs: data.blogs?.length || 0,
      contacts: data.contactMessages?.length || 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Khởi tạo mock data khi tải file
export function initStorage() {
  StorageManager.initializeMockData();
  console.log("📊 Current Stats:", StorageManager.getStats());
}
