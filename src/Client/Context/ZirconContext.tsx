/* eslint-disable max-classes-per-file -- We'll evaluate that later */
import Roact from "@rbxts/roact";

import { ZirconClient } from "../../index";
import type { ZirconClientDispatchService } from "../../Services/ClientDispatchService";
import type { ZirconClientRegistryService } from "../../Services/ClientRegistryService";

interface Contexts {
	_zrso4dispatcher: ZirconClientDispatchService;
	_zrso4registry: ZirconClientRegistryService;
}

class ZirconProvider extends Roact.Component {
	private readonly __addContext!: <TKey extends keyof Contexts>(
		this: ZirconProvider,
		key: TKey,
		value: Contexts[TKey],
	) => void;

	constructor(props: {}) {
		super(props);
		this.__addContext("_zrso4dispatcher", ZirconClient.Dispatch);
		this.__addContext("_zrso4registry", ZirconClient.Registry);
	}

	public render(): Roact.Element {
		return <Roact.Fragment>{this.props[Roact.Children]}</Roact.Fragment>;
	}
}

interface ZirconConsumerProps {
	render: (dispatcher: ZirconClientDispatchService) => Roact.Element | undefined;
}
class ZirconConsumer extends Roact.Component<ZirconConsumerProps> {
	private readonly __getContext!: <TKey extends keyof Contexts>(
		this: ZirconConsumer,
		key: TKey,
	) => Contexts[TKey];

	private readonly dispatcher: ZirconClientDispatchService;
	constructor(props: ZirconConsumerProps) {
		super(props);
		this.dispatcher = this.__getContext("_zrso4dispatcher");
	}

	public render(): Roact.Element {
		return <Roact.Fragment>{this.props.render(this.dispatcher)}</Roact.Fragment>;
	}
}

namespace ZirconContext {
	export const Provider = ZirconProvider;
	export const Consumer = ZirconConsumer;
}

export default ZirconContext;
