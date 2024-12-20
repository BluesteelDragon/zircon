import { ZirconFunctionBuilder } from "Class/ZirconFunctionBuilder";

const ZirconEnumPrint = new ZirconFunctionBuilder("print")
	.AddArgument("ZrEnum")
	.Bind((context, args) => {
		const items = args.getItems().map(enumItem => enumItem.getName());
		context.LogInfo("Enum Items for {EnumName}: {EnumItems} ", args.getEnumName(), items);
	});

export = ZirconEnumPrint;
