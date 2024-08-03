export interface CategoryData {
	categories: {
		name: string;
		duration: number;
		percentage: number;
	}[];
	total_duration: number;
}

const AW_SERVER_URL = "http://localhost:5000";

export async function fetchCategoryData(
	bucket: string,
	hours: number,
): Promise<CategoryData> {
	const startTime = new Date(
		Date.now() - hours * 60 * 60 * 1000,
	).toISOString();
	const endTime = new Date().toISOString();
	const url = `${AW_SERVER_URL}/category_data/${bucket}/${hours}`;

	console.log(`Fetching data from: ${url}`);

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data as CategoryData;
	} catch (error) {
		console.error("Error fetching category data:", error);
		throw error;
	}
}

export async function fetchBuckets(): Promise<string[]> {
	const url = `${AW_SERVER_URL}/analyzer_buckets`;
	console.log(`Fetching buckets from: ${url}`);

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error fetching buckets:", error);
		throw error;
	}
}

function getStartTime(hours: number): string {
	const start = new Date(Date.now() - hours * 60 * 60 * 1000);
	return start.toISOString();
}

function getEndTime(): string {
	return new Date().toISOString();
}
