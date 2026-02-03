import { JSX } from "jsx-dom";
import { Observable } from "rxjs";


type Attributes<Node extends HTMLElement> = Partial<{ [Field in keyof Node]: Observable<Node[Field]> }>;

type Children = Observable<JSX.Element | JSX.Element[]>;

type Props<Node extends HTMLElement> = Omit<Attributes<Node>, "children"> & {
    children: Children;
}

export const bind = <Node extends HTMLElement>(
    { children, style, ... atts }: Partial<Props<Node>>
) =>
    ( node: Node ) => {
        const bindChildren = ( subject: Children ) =>
            subject.subscribe( newValue => {
                node.innerHTML = "";
                if ( Array.isArray( newValue ) ) {
                    node.append( ... newValue );
                }
                else {
                    node.appendChild( newValue );
                }
            } );

        const bindStyle = ( subject: Observable<CSSStyleDeclaration> ) =>
            subject.subscribe( newValue => {
                node.style.cssText = "";
                Object.assign( node.style, newValue );
            } );

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
        bindAttributes( atts as Attributes<Node> );
    };


export default bind;