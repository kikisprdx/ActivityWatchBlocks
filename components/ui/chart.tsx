import React from "react";
import { Tooltip, TooltipProps } from "recharts";

export interface ChartConfig {
	[key: string]: {
		label: string;
		color: string;
	};
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	config: ChartConfig;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
	config,
	className,
	children,
	...props
}) => {
	return (
		<div className={className} {...props}>
			<style>
				{Object.entries(config).map(
					([key, value]) => `
                    :root {
                        --color-${key}: ${value.color};
                    }
                    `,
				)}
			</style>
			{children}
		</div>
	);
};

export const ChartTooltip: React.FC<TooltipProps<any, any>> = (props) => {
	return <Tooltip {...props} />;
};

export const ChartTooltipContent: React.FC<any> = ({
	active,
	payload,
	label,
}) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-background p-2 shadow-sm border rounded-lg">
				<p className="text-sm font-semibold">{label}</p>
				{payload.map((entry: any, index: number) => (
					<p key={index} className="text-sm">
						{entry.name}: {entry.value.toFixed(2)} hours
					</p>
				))}
			</div>
		);
	}
	return null;
};
