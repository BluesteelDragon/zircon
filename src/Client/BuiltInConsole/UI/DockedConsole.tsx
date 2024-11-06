/* eslint-disable max-lines -- Will need to break this up */
import { SingleMotor, Spring } from "@rbxts/flipper";
import type { ClientSenderEvent } from "@rbxts/net/out/client/ClientEvent";
import Roact from "@rbxts/roact";
import { connect } from "@rbxts/roact-rodux";
import type { DispatchParam } from "@rbxts/rodux";
import { Workspace } from "@rbxts/services";

import Dropdown from "Client/Components/Dropdown";
import MultiSelectDropdown from "Client/Components/MultiSelectDropdown";
import Padding from "Client/Components/Padding";
import SearchTextBox from "Client/Components/SearchTextBox";
import { $print } from "rbxts-transform-debug";
import { GetCommandService } from "Services";

import ZirconOutput from "../../../Client/Components/Output";
import { ZirconContext, ZirconLogLevel, ZirconMessageType } from "../../../Client/Types";
import ThemeContext from "../../../Client/UIKit/ThemeContext";
import Remotes, { RemoteId } from "../../../Shared/remotes";
import ZirconIcon, { ZirconIconButton } from "../../Components/Icon";
import ZirconSyntaxTextBox, { HistoryTraversalDirection } from "../../Components/SyntaxTextBox";
import type ZirconClientStore from "../Store";
import type { ConsoleReducer } from "../Store/_reducers/console-reducer";
import { ConsoleActionName, DEFAULT_FILTER } from "../Store/_reducers/console-reducer";

export interface DockedConsoleProps extends MappedProps, MappedDispatch {}

interface DockedConsoleState {
	context: ZirconContext;
	filterVisible?: boolean;
	historyIndex: number;
	isFullView: boolean;
	isVisible: boolean;
	levelFilter: Set<ZirconLogLevel>;
	searchQuery: string;
	sizeY: number;
	source: string;
}

// 18
const MAX_SIZE = 28 * 10;

class ZirconConsoleComponent extends Roact.Component<DockedConsoleProps, DockedConsoleState> {
	private readonly dispatch: ClientSenderEvent<[input: string]>;
	private readonly filterSettingsSizeY: SingleMotor;

	private readonly filterSizeY: Roact.Binding<number>;
	private readonly outputTransparency: Roact.Binding<number>;

	private readonly outputTransparencyMotor: SingleMotor;
	private readonly positionY: Roact.Binding<number>;
	private readonly positionYMotor: SingleMotor;
	private readonly sizeY: Roact.Binding<number>;
	private readonly sizeYMotor: SingleMotor;

	// eslint-disable-next-line max-lines-per-function -- a 23
	constructor(props: DockedConsoleProps) {
		super(props);
		this.state = {
			context: !props.executionEnabled ? ZirconContext.Client : ZirconContext.Server,
			filterVisible: false,
			historyIndex: 0,
			isFullView: false,
			isVisible: props.isVisible,
			levelFilter: props.levelFilter,
			searchQuery: props.searchQuery,
			sizeY: MAX_SIZE,
			source: "",
		};

		// Initialization
		this.positionYMotor = new SingleMotor(0);
		this.sizeYMotor = new SingleMotor(MAX_SIZE);
		this.filterSettingsSizeY = new SingleMotor(0);
		this.outputTransparencyMotor = new SingleMotor(0.1);
		let setPositionY: Roact.BindingFunction<number>;
		let setSizeY: Roact.BindingFunction<number>;
		let setOutputTransparency: Roact.BindingFunction<number>;
		let setFilterSizeY: Roact.BindingFunction<number>;

		// Bindings
		[this.positionY, setPositionY] = Roact.createBinding(this.positionYMotor.getValue());
		[this.sizeY, setSizeY] = Roact.createBinding(this.sizeYMotor.getValue());
		[this.filterSizeY, setFilterSizeY] = Roact.createBinding(
			this.filterSettingsSizeY.getValue(),
		);
		[this.outputTransparency, setOutputTransparency] = Roact.createBinding(
			this.outputTransparencyMotor.getValue(),
		);

		//  Binding updates
		this.filterSettingsSizeY.onStep(value => {
			setFilterSizeY(value);
		});
		this.positionYMotor.onStep(value => {
			setPositionY(value);
		});
		this.sizeYMotor.onStep(value => {
			setSizeY(value);
		});
		this.outputTransparencyMotor.onStep(value => {
			setOutputTransparency(value);
		});

		const DispatchToServer = Remotes.Client.WaitFor(RemoteId.DispatchToServer).expect();
		this.dispatch = DispatchToServer;
	}

	// eslint-disable-next-line max-lines-per-function -- a 25
	public didUpdate(previousProps: DockedConsoleProps, previousState: DockedConsoleState): void {
		if (
			previousProps.isVisible !== this.props.isVisible ||
			previousState.isFullView !== this.state.isFullView ||
			previousState.filterVisible !== this.state.filterVisible
		) {
			// eslint-disable-next-line ts/no-non-null-assertion -- This should always exist at this time.
			const fullScreenViewSize = Workspace.CurrentCamera!.ViewportSize;
			const size = this.state.isFullView ? fullScreenViewSize.Y - 40 : MAX_SIZE;
			this.positionYMotor.setGoal(new Spring(this.props.isVisible ? size + 40 : 0));
			this.outputTransparencyMotor.setGoal(new Spring(this.state.isFullView ? 0.35 : 0.1));
			this.filterSettingsSizeY.setGoal(
				new Spring(this.state.isFullView || this.state.filterVisible ? 40 : 0),
			);
			this.sizeYMotor.setGoal(new Spring(size));
			this.setState({ isVisible: this.props.isVisible });
		}

		if (
			previousProps.clientExecutionEnabled !== this.props.clientExecutionEnabled &&
			!this.props.executionEnabled
		) {
			this.setState({ context: ZirconContext.Client });
		}

		if (previousProps.executionEnabled !== this.props.executionEnabled) {
			this.setState({
				context: this.props.executionEnabled ? ZirconContext.Server : ZirconContext.Client,
			});
		}

		if (previousProps.levelFilter !== this.props.levelFilter) {
			this.setState({ levelFilter: this.props.levelFilter });
		}

		if (previousProps.searchQuery !== this.props.searchQuery) {
			this.setState({ searchQuery: this.props.searchQuery });
		}
	}

	public renderNonExecutionBox(): Roact.Element {
		return (
			<ThemeContext.Consumer
				render={theme => {
					return (
						<frame
							BorderColor3={theme.SecondaryBackgroundColor3}
							BackgroundColor3={theme.PrimaryBackgroundColor3}
							Size={new UDim2(1, 0, 0, 28)}
							Position={new UDim2(0, 0, 1, -28)}
						>
							<uilistlayout FillDirection="Horizontal" HorizontalAlignment="Right" />
							<ZirconIconButton
								Icon={this.state.isFullView ? "UpDoubleArrow" : "DownDoubleArrow"}
								Size={new UDim2(0, 32, 0, 28)}
								OnClick={() => {
									this.setState({ isFullView: !this.state.isFullView });
								}}
							/>
						</frame>
					);
				}}
			/>
		);
	}

	// eslint-disable-next-line max-lines-per-function -- a 26
	public renderExecutionBox(): Roact.Element {
		const showDropdown = this.props.executionEnabled;

		return (
			<ThemeContext.Consumer
				// eslint-disable-next-line max-lines-per-function -- a 27
				render={theme => {
					return (
						<frame
							BorderColor3={theme.PrimaryBackgroundColor3}
							BackgroundColor3={theme.SecondaryBackgroundColor3}
							Size={new UDim2(1, 0, 0, 28)}
							Position={new UDim2(0, 0, 1, -28)}
						>
							<uilistlayout FillDirection="Horizontal" />
							{showDropdown && (
								<Dropdown<ZirconContext>
									Disabled={
										!this.props.clientExecutionEnabled ||
										!this.props.executionEnabled
									}
									Items={[
										{
											Icon: "ContextServer",
											Id: ZirconContext.Server,
											Text: "Server",
										},
										{
											Icon: "ContextClient",
											Id: ZirconContext.Client,
											Text: "Client",
										},
									]}
									SelectedItemId={this.state.context}
									Position={new UDim2(1, -150, 0, 0)}
									Size={new UDim2(0, 100, 1, 0)}
									ItemSelected={value => {
										this.setState({ context: value.Id });
									}}
								/>
							)}
							{/* <ZirconIconButton Size={new UDim2(0, 16, 0, 28)} Icon="Zirconium" OnClick={() => {}} /> */}
							<ZirconIcon Size={new UDim2(0, 16, 0, 28)} Icon="RightArrow" />
							<ZirconSyntaxTextBox
								RefocusOnSubmit={this.props.autoFocus}
								AutoFocus={this.props.autoFocus}
								CancelKeyCodes={this.props.toggleKeys}
								OnCancel={this.props.close}
								PlaceholderText="Enter script to execute"
								Size={new UDim2(1, -16 - 32 - (showDropdown ? 100 : 0), 1, 0)}
								Position={new UDim2(0, 16, 0, 0)}
								Focused={this.state.isVisible}
								Source={this.state.source}
								OnControlKey={key => {
									if (key !== Enum.KeyCode.E) {
										return;
									}

									if (
										!this.props.clientExecutionEnabled ||
										!this.props.executionEnabled
									) {
										return;
									}

									if (this.state.context === ZirconContext.Client) {
										this.setState({ context: ZirconContext.Server });
									} else {
										this.setState({ context: ZirconContext.Client });
									}
								}}
								OnEnterSubmit={input => {
									this.props.addMessage(input);

									switch (this.state.context) {
										case ZirconContext.Server: {
											this.dispatch.SendToServer(input);
											break;
										}
										case ZirconContext.Client: {
											void GetCommandService(
												"ClientDispatchService",
											).ExecuteScript(input);
											break;
										}
									}

									this.setState({ historyIndex: 0, source: "" });
								}}
								OnHistoryTraversal={direction => {
									let index = this.state.historyIndex;

									const { history } = this.props;
									let text = "";
									if (direction === HistoryTraversalDirection.Back) {
										index = index <= 0 ? history.size() - 1 : index - 1;

										text = history[index];
									} else {
										index = index >= history.size() - 1 ? 0 : index + 1;

										text = history[index];
									}

									$print("[historyTraversal]", direction, text, history);

									this.setState({
										historyIndex: index,
										source: text,
									});
								}}
							/>
							<ZirconIconButton
								Icon={this.state.isFullView ? "UpDoubleArrow" : "DownDoubleArrow"}
								Size={new UDim2(0, 32, 0, 28)}
								OnClick={() => {
									this.setState({ isFullView: !this.state.isFullView });
								}}
							/>
						</frame>
					);
				}}
			/>
		);
	}

	// eslint-disable-next-line max-lines-per-function -- a 28
	public render(): Roact.Element {
		const canExec = this.props.clientExecutionEnabled || this.props.executionEnabled;

		const sizePositionBinding = Roact.joinBindings({
			Position: this.positionY,
			Size: this.sizeY,
		});
		return (
			<ThemeContext.Consumer
				// eslint-disable-next-line max-lines-per-function -- a 29
				render={theme => {
					return (
						<screengui
							ZIndexBehavior="Sibling"
							DisplayOrder={10000}
							ResetOnSpawn={false}
							IgnoreGuiInset
						>
							<frame
								Key="ZirconViewport"
								Active={this.state.isFullView}
								BorderSizePixel={0}
								BackgroundTransparency={
									theme.Dock.Transparency ?? this.outputTransparency
								}
								BackgroundColor3={theme.PrimaryBackgroundColor3}
								ClipsDescendants
								Size={sizePositionBinding.map(
									value => new UDim2(1, 0, 0, value.Size),
								)}
								Position={sizePositionBinding.map(
									value => new UDim2(0, 0, 0, -value.Size + value.Position),
								)}
							>
								<frame
									Position={this.filterSizeY.map(
										value =>
											new UDim2(0, 0, 0, this.state.isFullView ? value : 0),
									)}
									Size={this.filterSizeY.map(value => {
										return new UDim2(
											1,
											0,
											1,
											this.state.isFullView ? value - 30 : -30,
										);
									})}
									BackgroundTransparency={1}
								>
									<ZirconOutput />
								</frame>

								<frame
									Size={new UDim2(0, 100, 0, 30)}
									Position={new UDim2(1, -100, 0, 5)}
									BackgroundTransparency={1}
								>
									<uilistlayout
										FillDirection="Horizontal"
										HorizontalAlignment="Right"
										Padding={new UDim(0, 5)}
									/>
									<Padding Padding={{ Right: 25 }} />
									<ZirconIconButton
										Icon="Funnel"
										ZIndex={2}
										Floating
										Size={new UDim2(0, 30, 0, 30)}
										OnClick={() => {
											this.setState({ filterVisible: true });
										}}
									/>
								</frame>
								<frame
									Key="FilterLayout"
									Size={this.filterSizeY.map(value => new UDim2(1, 0, 0, value))}
									ClipsDescendants
									BackgroundColor3={theme.PrimaryBackgroundColor3}
									BorderSizePixel={1}
									BorderColor3={theme.SecondaryBackgroundColor3}
								>
									<frame
										Key="LeftContent"
										BackgroundTransparency={1}
										Size={new UDim2(0.5, 0, 1, 0)}
									>
										<uilistlayout
											FillDirection="Horizontal"
											HorizontalAlignment="Left"
											Padding={new UDim(0, 10)}
										/>
										<Padding Padding={{ Horizontal: 20, Vertical: 5 }} />
										<Dropdown<undefined | ZirconContext>
											Items={[
												{
													Id: undefined,
													SelectedText: "(Context)",
													Text: "All Contexts",
													TextColor3: Color3.fromRGB(150, 150, 150),
												},
												{
													Icon: "ContextServer",
													Id: ZirconContext.Server,
													Text: "Server",
												},
												{
													Icon: "ContextClient",
													Id: ZirconContext.Client,
													Text: "Client",
												},
											]}
											SelectedItemId={undefined}
											ItemSelected={item => {
												this.props.updateContextFilter(item.Id);
											}}
										/>
										<MultiSelectDropdown<ZirconLogLevel>
											Label="Level Filter"
											SelectedItemIds={this.state.levelFilter}
											Items={[
												{
													Id: ZirconLogLevel.Verbose,
													Text: "Verbose",
												},
												{
													Id: ZirconLogLevel.Debug,
													Text: "Debugging",
												},
												{
													Id: ZirconLogLevel.Info,
													Text: "Information",
												},
												{
													Id: ZirconLogLevel.Warning,
													Text: "Warnings",
												},
												{
													Id: ZirconLogLevel.Error,
													Text: "Errors",
												},
												{
													Id: ZirconLogLevel.Wtf,
													Text: "Fatal Errors",
												},
											]}
											ItemsSelected={items => {
												this.props.updateLevelFilter(items);
											}}
										/>
									</frame>
									<frame
										Key="RightContent"
										Size={new UDim2(0.5, 0, 1, 0)}
										Position={new UDim2(0.5, 0, 0, 0)}
										BackgroundTransparency={1}
									>
										<uilistlayout
											FillDirection="Horizontal"
											HorizontalAlignment="Right"
											Padding={new UDim(0, 10)}
										/>
										<Padding Padding={{ Horizontal: 25, Vertical: 5 }} />
										<SearchTextBox
											Value={this.state.searchQuery}
											TextChanged={value => {
												this.props.updateSearchFilter(value);
											}}
										/>
										{!this.state.isFullView && (
											<ZirconIconButton
												Icon="UpDoubleArrow"
												Floating
												Size={new UDim2(0, 30, 0, 30)}
												OnClick={() => {
													this.setState({ filterVisible: false });
												}}
											/>
										)}
									</frame>
								</frame>

								{canExec && this.renderExecutionBox()}
								{!canExec && this.renderNonExecutionBox()}
							</frame>
						</screengui>
					);
				}}
			/>
		);
	}
}

interface MappedDispatch {
	addMessage: (message: string) => void;
	close: () => void;
	updateContextFilter: (context: undefined | ZirconContext) => void;
	updateLevelFilter: (levels: Set<ZirconLogLevel>) => void;
	updateSearchFilter: (search: string) => void;
}
interface MappedProps {
	autoFocus: boolean;
	clientExecutionEnabled: boolean;
	executionEnabled: boolean;
	history: Array<string>;
	isVisible: boolean;
	levelFilter: Set<ZirconLogLevel>;
	searchQuery: string;
	toggleKeys: Array<Enum.KeyCode>;
}

function mapStateToProps(state: ConsoleReducer): MappedProps {
	return {
		autoFocus: state.autoFocusTextBox,
		clientExecutionEnabled: state.canExecuteLocalScripts,
		executionEnabled: state.executionEnabled,
		history: state.history,
		isVisible: state.visible,
		levelFilter: state.filter.Levels ?? DEFAULT_FILTER,
		searchQuery: state.filter.SearchQuery ?? "",
		toggleKeys: state.bindingKeys,
	};
}

// eslint-disable-next-line max-lines-per-function -- a 24
function mapPropsToDispatch(dispatch: DispatchParam<ZirconClientStore>): MappedDispatch {
	return {
		addMessage: source => {
			dispatch({
				message: source,
				type: ConsoleActionName.AddHistory,
			});
			dispatch({
				message: {
					source,
					type: ZirconMessageType.ZirconiumExecutionMessage,
				},
				type: ConsoleActionName.AddOutput,
			});
		},
		close: () => dispatch({ type: ConsoleActionName.SetConsoleVisible, visible: false }),
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
		updateSearchFilter: query => {
			dispatch({ SearchQuery: query, type: ConsoleActionName.UpdateFilter });
		},
	};
}

/** A docked console. */
const ZirconDockedConsole = connect(mapStateToProps, mapPropsToDispatch)(ZirconConsoleComponent);
export default ZirconDockedConsole;
