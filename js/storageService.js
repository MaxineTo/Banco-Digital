// Read and write data || Almacenar y consultar data del localStorage

export const storage = {
    read(key) {
        try {
            return JSON.parse(localStorage.get(key)) ?? [];
        } catch {
            return [];
        }
    },
    write(key, value) {
        localStorage.setItem(key, JSON.stringify(value))
    },
    remove(key){
        localStorage.removeItem(key);
    }
}

// Ahora puedo exportar y llanarlos así: storage.read(key) y storage.write(key, value)
