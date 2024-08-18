export interface CategoryData {
    categories: {
        name: string;
        duration: number;
        percentage: number;
    }[];
    total_duration: number;
}

export interface DateFrequencyData {
    activity: string;
    start_time: string;
    duration: number;
}

export interface EventPointData {
    bucket_id: string;
    data_source: string;
    end_date: string;
    events: Event[];
}

interface Event {
    data: {
        app: string;
        title: string;
    };
    date: string;
    duration: number;
    id: number;
    time: string;
    timestamp: string;
}

export interface ChartState {
    data: CategoryData;
    prevData: CategoryData;
    selectedTimeframe?: string;
    selectedPeriod: {from: Date, to: Date};
    selectedBucket: string;
    error: string | null;
    categoryCount: number;
    binSize: string;
    timeframe: string;
    dateRange?: { from: Date | undefined; to: Date | undefined };
}

export interface StochasticDataPoint {
    end: string;
    categories: { [key: string]: number };
}

export interface StochasticData {
    period_data: StochasticDataPoint[];
    period_hours: number;
    timeframe_days: number;
    total_periods: number;
    bucket_id: string; // Add this line
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

export function calculatePreviousPeriodData(combinedData: CategoryData, currentData: CategoryData): CategoryData {
    const prevData: CategoryData = {
        categories: combinedData.categories.map(combinedCategory => {
            const currentCategory = currentData.categories.find(c => c.name === combinedCategory.name);
            return {
                name: combinedCategory.name,
                duration: currentCategory ? combinedCategory.duration - currentCategory.duration : combinedCategory.duration,
                percentage: 0 // We'll calculate this after
            };
        }).filter(category => category.duration > 0), // Remove categories with zero or negative duration
        total_duration: combinedData.total_duration - currentData.total_duration
    };

    // Recalculate percentages for the previous period
    prevData.categories.forEach(category => {
        category.percentage = (category.duration / prevData.total_duration) * 100;
    });

    return prevData;
}

// Example usage in fetchTimeframeData
export async function fetchTimeframeData(hours: number, bucket: string): Promise<{ data: CategoryData, prev_data: CategoryData }> {
    console.log(`Handling timeframe change: ${hours} hours, bucket: ${bucket}`);

    const currentData = await fetchCategoryData(bucket, hours);
    const combinedData = await fetchCategoryData(bucket, hours * 2);
    const prevData = calculatePreviousPeriodData(combinedData, currentData);

    return { data: currentData, prev_data: prevData };
}

export async function fetchStochasticData(
    bucketId: string,
    periodHours: number,
    timeframeDays: number,
): Promise<StochasticData> {
    let url = `http://localhost:5000/stochastic_data/${bucketId}/${periodHours}/${timeframeDays}`;
    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

export async function fetchDetailedData(
    bucketId: string, 
    startDate: Date | string,
    endDate: Date | string
): Promise<EventPointData> {
    // Helper function to ensure we have a valid ISO string
    const toISOString = (date: Date | string): string => {
        if (date instanceof Date) {
            return date.toISOString();
        } else if (typeof date === 'string') {
            // Attempt to parse the string as a date
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                throw new Error(`Invalid date string: ${date}`);
            }
            return parsedDate.toISOString();
        } else {
            throw new Error(`Invalid date type: ${typeof date}`);
        }
    };

    try {
        const startDateISO = toISOString(startDate);
        const endDateISO = toISOString(endDate);

        const url = `http://localhost:5000/detailed_data/${bucketId}/${startDateISO}/${endDateISO}`;
        console.log(`Fetching detailed data from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in fetchDetailedData:', error);
        throw error; // Re-throw the error for the caller to handle
    }
}

function filterDataByDateRange(data: StochasticData, from: Date, to: Date): StochasticData {
    const filteredPeriodData = data.period_data.filter(point => {
        const pointDate = new Date(point.end);
        return pointDate >= from && pointDate <= to;
    });
  
    return {
        ...data,
        period_data: filteredPeriodData,
        total_periods: filteredPeriodData.length
    };
}

export function calculateTimeOfDayFrequency(
    data: EventPointData
):  DateFrequencyData[]  {
    const rawData = data.events.map(event => {
        const date = new Date(event.timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const startTime = `${hours}:${minutes}:${seconds}`;
        
        return {
            activity: event.data.app,
            start_time: startTime,
            duration: event.duration / 3600  // Convert seconds to hours
        };
    });

    // You can print rawData here before converting to objects
    console.log(JSON.stringify(rawData, null, 2));

    const objectData = rawData.map(item => ({
        activity: item.activity,
        start_time: item.start_time,
        duration: item.duration
    }));

    return objectData;
}
  
  export async function fetchStocahsticTimeframeData(
    bucket: string,
    periodHours: number,
    from: Date,
    to: Date
): Promise<{ data: StochasticData; prev_data: StochasticData }> {
    const today = new Date();
    const daysToFetch = Math.ceil((today.getTime() - from.getTime()) / (86400000)); // 86400000 ms in a day

    console.log(`Fetching data for ${daysToFetch} days from ${from.toISOString()} to ${today.toISOString()}`);
    const fullData = await fetchStochasticData(bucket, periodHours, daysToFetch);

    const currentData = filterDataByDateRange(fullData, from, to);
    
    const prevPeriodDuration = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - prevPeriodDuration);
    const prevTo = new Date(from.getTime());
    const prevData = filterDataByDateRange(fullData, prevFrom, prevTo);

    return { data: currentData, prev_data: prevData };
}






