export interface CategoryData {
    categories: {
        name: string;
        duration: number;
        percentage: number;
    }[];
    total_duration: number;
}


export interface ChartState {
    data: CategoryData;
    prevData: CategoryData;
    selectedTimeframe: string;
    selectedBucket: string;
    error: string | null;
}


export type SetChartState = (state: Partial<ChartState>) => void;


export async function fetchBuckets(): Promise<string[]> {
    try {
        const response = await fetch('http://localhost:5000/analyzer_buckets');
        if (!response.ok) {
            throw new Error('Failed to fetch buckets');
        }
        const bucketData: string[] = await response.json();
        return bucketData;
    } catch (error) {
        console.error('Error fetching buckets:', error);
        throw error; // Re-throw the error so the caller can handle it
    }
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

export async function fetchTimeframeData(hours: number, bucket: string): Promise<{ data: CategoryData, prev_data: CategoryData }> {
    console.log(`Handling timeframe change: ${hours} hours, bucket: ${bucket}`);
    const data = await fetchCategoryData(bucket, hours);
    const prev_data = await fetchCategoryData(bucket, hours * 2);
    return { data, prev_data };
}

