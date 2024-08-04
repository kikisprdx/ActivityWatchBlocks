export interface CategoryData {
    categories: {
        name: string;
        duration: number;
        percentage: number;
    }[];
    total_duration: number;
}

export async function fetchCategoryData(bucket: string, hours: number): Promise<CategoryData> {
    const url = `http://localhost:5000/category_data/${bucket}/${hours}`;
    console.log(`Fetching data from: ${url}`);

    try {
        const response = await fetch(url, {
            method: "GET",
            mode: "cors",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            console.error(`Response text: ${await response.text()}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received data from API:", JSON.stringify(data, null, 2));

        return data as CategoryData;
    } catch (error) {
        console.error("Error fetching category data:", error);
        if (error instanceof TypeError && error.message === "Failed to fetch") {
            console.error("This error often occurs due to CORS issues or if the server is not running.");
        }
        throw error;
    }
}
