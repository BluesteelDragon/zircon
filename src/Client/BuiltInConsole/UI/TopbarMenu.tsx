import Roact from "@rbxts/roact";
import { connect } from "@rbxts/roact-rodux";
import type { DispatchParam } from "@rbxts/rodux";

import type { ZirconContext, ZirconLogLevel } from "Client/Types";
import ThemeContext from "Client/UIKit/ThemeContext";

import type ZirconClientStore from "../Store";
import type { ConsoleReducer } from "../Store/_reducers/console-reducer";
import { ConsoleActionName, DEFAULT_FILTER } from "../Store/_reducers/console-reducer";

export interface TopbarProps extends MappedProps, MappedDispatch {}

interface TopbarState {
	isVisible: boolean;
	levelFilter: Set<ZirconLogLevel>;
}

class ZirconTopbarMenuComponent extends Roact.Component<TopbarProps, TopbarState> {
	constructor(props: TopbarProps) {
		super(props);
		this.state = {
			isVisible: props.isVisible,
			levelFilter: props.levelFilter,
		};
	}

	public didUpdate(previousProps: TopbarProps): void {
		if (previousProps.isVisible !== this.props.isVisible) {
			this.setState({ isVisible: this.props.isVisible });
		} else if (previousProps.levelFilter !== this.props.levelFilter) {
			this.setState({ levelFilter: this.props.levelFilter });
		}
	}

	// eslint-disable-next-line max-lines-per-function -- a 34
	public render(): Roact.Element {
		return (
			<ThemeContext.Consumer
				// eslint-disable-next-line max-lines-per-function -- a 35
				render={theme => {
					return (
						<screengui DisplayOrder={10001} ResetOnSpawn={false} IgnoreGuiInset>
							<frame
								Visible={this.state.isVisible}
								Size={new UDim2(1, 0, 0, 40)}
								BackgroundColor3={theme.PrimaryBackgroundColor3}
								BorderSizePixel={0}
								Position={
									this.state.isVisible
										? new UDim2(0, 0, 0, 0)
										: new UDim2(0, 0, 0, -40)
								}
							>
								<uipadding PaddingLeft={new UDim(0, 60)} />
								<uilistlayout
									VerticalAlignment="Center"
									FillDirection="Horizontal"
									Padding={new UDim(0, 10)}
								/>
								<frame Size={new UDim2(0, 32, 0, 32)} BackgroundTransparency={1}>
									<uilistlayout
										VerticalAlignment="Center"
										HorizontalAlignment="Center"
									/>
									{/* <ZirconIcon Icon="Zirconium" /> */}
								</frame>
							</frame>
						</screengui>
					);
				}}
			/>
		);
	}
}

interface MappedDispatch {
	updateContextFilter: (context: undefined | ZirconContext) => void;
	updateLevelFilter: (levels: Set<ZirconLogLevel>) => void;
}
interface MappedProps {
	isVisible: boolean;
	levelFilter: Set<ZirconLogLevel>;
}
function mapStateToProps(state: ConsoleReducer): MappedProps {
	return {
		isVisible: state.visible,
		levelFilter: state.filter.Levels ?? DEFAULT_FILTER,
	};
}

function mapPropsToDispatch(dispatch: DispatchParam<ZirconClientStore>): MappedDispatch {
	return {
		updateContextFilter: Context => {
			if (Context !== undefined) {
				dispatch({ Context, type: ConsoleActionName.UpdateFilter });
			} else {
				dispatch({ filter: "Context", type: ConsoleActionName.RemoveFilter });
			}
		},
		updateLevelFilter: Levels => {
			if (Levels !== undefined) {
				dispatch({ Levels, type: ConsoleActionName.UpdateFilter });
			} else {
				dispatch({ filter: "Levels", type: ConsoleActionName.RemoveFilter });
			}
		},
	};
}

/** A docked console. */
const ZirconTopBar = connect(mapStateToProps, mapPropsToDispatch)(ZirconTopbarMenuComponent);
export default ZirconTopBar;
