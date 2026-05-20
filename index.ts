import { JSX } from "jsx-dom";
import { Observable } from "rxjs";


type Attributes<Node extends HTMLElement> = Partial<{ [Field in keyof Node]: Observable<Node[Field]> }>;

type Children = Observable<JSX.Element | JSX.Element[] | null>;

type StyleProps = {
    [K in keyof CSSStyleDeclaration as CSSStyleDeclaration[K] extends string ? K : never]: CSSStyleDeclaration[K];
};

type Style = Partial<{ [Prop in keyof StyleProps]: Observable<string> }>;

type Dataset = { [k: string]: Observable<string | undefined> };

type Props<Node extends HTMLElement> = Omit<Attributes<Node>, "children" | "style" | "dataset"> & {
    children: Children;
    style: Style;
    dataset: Dataset
}

export const bind = <Node extends HTMLElement>(
    { children, style, dataset, ... atts }: Partial<Props<Node>>
) =>
    ( node: Node ) => {
        const bindChildren = ( subject: Children ) =>
            subject.subscribe( newValue => {
                node.innerHTML = "";
                if ( newValue ) {
                    if ( Array.isArray( newValue ) ) {
                        node.append( ... newValue );
                    }
                    else {
                        node.appendChild( newValue );
                    }
                }
            } );

        const bindDataset = ( dataset: Dataset ) => {
            for ( let prop in dataset ) {
                const field = prop;
                if ( dataset.hasOwnProperty( field ) && undefined !== dataset[field] ) {
                    dataset[field].subscribe( newValue => {
                        node.dataset[field] = newValue;
                    } );
                }
            }
        }

        const bindStyle = ( style: Style ) => {
            type Defined<P extends keyof Style> = Exclude<Style[P], undefined>;

            let prop: keyof Style;
            for ( prop in style ) {
                const field = prop;
                if ( style.hasOwnProperty( field ) && undefined !== style[field] ) {
                    (style[field] as Defined<typeof field>).subscribe( newValue => {
                        node.style[field] = newValue;
                    } );
                }
            }
        }

        const bindAttributes = ( atts: Attributes<Node> ) => {
            type Defined<P extends keyof typeof atts> = Exclude<typeof atts[P], undefined>;

            let prop: keyof typeof atts;
            for ( prop in atts ) {
                const field = prop;
                if ( atts.hasOwnProperty( field ) && undefined !== atts[field] ) {
                    (atts[field] as Defined<typeof field>).subscribe( newValue => {
                        node[field] = newValue;
                    } );
                }
            }
        }

        if ( undefined !== children ) {
            bindChildren( children );
        }
        if ( undefined !== style ) {
            bindStyle( style );
        }
        if ( undefined !== dataset ) {
            bindDataset( dataset );
        }
        bindAttributes( atts as Attributes<Node> );
    };


export default bind;