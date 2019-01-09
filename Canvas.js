//   +-------------------------------------------+   //
//   |                                           |   //
//   |                 canvas.js                 |   //
//   |                version 1.2                |   //
//   |                                           |   //
//   | author: Tim Greller      > tim-greller.tk |   //
//   | published: > github.com/timlg07/Canvas.js |   //
//   |                                           |   //
//   +-------------------------------------------+   //


// global class CANVAS
class Canvas {
    
    // Creates a new canvas or sets up an existing one.
    // @param {String} query-selector for the parent of the new canvas (which will be created)
    //                 or an existing canvas (in this case width and height are not required)
    //      [ {Number} width  (can be adjusted with CSS afterwards) ]
    //      [ {Number} height (can be adjusted with CSS afterwards) ]
    constructor( selector, width, height ){
        
        if( document.querySelector( selector ).tagName == "CANVAS" ){
            this.obj = document.querySelector( selector );
        } else {
            this._createCanvasObj( selector, width, height );
        }
        
        this.context = this.obj.getContext( "2d" );
        
        this.nodes = [];
        this.obj.addEventListener( "touchstart", this.onClick.bind( this ));
        this.obj.addEventListener( "click",      this.onClick.bind( this ));
    }
    
    
    // [private function]
    // Creates a new canvas. Is used by the constructor.
    _createCanvasObj( containerSelector, width, height ){
        this.obj = document.createElement("canvas");
        this.obj.width  = width;
        this.obj.height = height;
        document.querySelector( containerSelector ).appendChild( this.obj );
    }
    
    
    // @param {CanvasNode} new node
    addNode( node ){
        if( node && node instanceof CanvasNode ){
            this.nodes.push( node );
            this.nodes.sort(( a, b )=>{
                return a.z - b.z;
            });
        } else {
            throw new TypeError("addNode called without a CanvasNode-Object");
        }
    }
    
    
    // @param  {CanvasNode} node which should get removed
    // @return {boolean}    success
    removeNode( node ){
        if( node && node instanceof CanvasNode ){
            let index = this.nodes.indexOf( node );
            if( index > -1 ){
                this.nodes.splice(index, 1);
                return true;
            }
        } else {
            throw new TypeError("removeNode called without a CanvasNode-Object");
        }
        return false;
    }
    
    
    // checks if a CanvasNode is at the given position
    // @param  {Object}  x and y value of the position
    // @return {boolean} true if a CanvasNode covers the point
    isNodeAt({ x,y }){
        for( let node of this.nodes ){
            if( node.covers( {x,y} ) ){
                return true;
            }
        }
        return false;
    }
    
    
    // @param  {Object} x and y value of the position
    // @return {CanvasNode} Object at the position; null if no node
    getNodeAt({ x,y }){
        let r = {z:-1,nul:true};
        for( let node of this.nodes ){
            if( node.covers( {x,y} ) && node.z > r.z ){
                r = node;
            }
        }
        return r.nul ? null : r ;
    }
    
    
    // listener for click or touch events
    onClick( evt ){
        
        let rect   = this.obj.getBoundingClientRect(); // absolute size of element
        let scaleX = this.obj.width  / rect.width  ;   // horizontal relationship bitmap vs. element
        let scaleY = this.obj.height / rect.height ;   // vertical   relationship bitmap vs. element

        let click = {
            x: Math.round(( evt.pageX - this.obj.offsetLeft) * scaleX ), // scale mouse coordinates after they have
            y: Math.round(( evt.pageY - this.obj.offsetTop ) * scaleY )  // been adjusted to be relative to element
        }
        
        if( this.isNodeAt ( click ) ){
            this.getNodeAt( click ).onClick( evt );
        }
        
    }
    
    
    // @return {Number} width of the Canvas HTML-Object
    get width( ){
        return this.obj.width;
    }
    
    
    // @return {Number} height of the Canvas HTML-Object
    get height( ){
        return this.obj.height;
    }
    
    
    // starts updating and drawing the CanvasNodes
    // @param [ {String} HTML-element-id to show the current fps ]
    startInterval( id ){
        this.startTime     = -1;
        this.lastFrameTime = -1;
        this.showFPS_id    = id || null;
        window.requestAnimationFrame( this.update.bind( this ));
    }
    
    
    // called every frame // start the updating with startInterval( )
    // @param {Number} timestamp
    update( time ){
        // check if redrawing is necessary
        let redraw = false;
        // if it's the first call: don't update, but draw 
        if( this.startTime == -1 ){
            this.startTime = time;
            redraw = true;
        } else {
            // calculating fps //
            // time since last update in ms
            let deltaTime = time - this.lastFrameTime;
            // frames per second
            this.fps = 1 / ( deltaTime / 1000 );
            // executing updates //
            // update all nodes
            for( let node of this.nodes ){
                 if( node.update.call( node, this.fps )){
                     redraw = true;
                 }
            }
        }
        // redraw if necessary
        if( redraw ){
            this.context.clearRect( 0,0,this.width,this.height );
            for( let node of this.nodes ){
                 node.draw.call( node, this.context );
            }
        }
        // saving current time
        this.lastFrameTime = time;
        // looping
        window.requestAnimationFrame( this.update.bind( this ));
    }
    
    
    // sets the value of fps [and updates it in the fps-display]
    // @param {Number} current frames per second
    set fps( fps ){
        this._fps = fps;
        let  text = Math.round( fps/**10*/ )/*/10*/;
        if( this.showFPS_id ){
            let elem = document.getElementById( this.showFPS_id );
            if( elem && elem.innerText != text ){
                elem.innerText = text;
            }
        }
    }
    
    // @return {Number} current frames per second of the canvas
    get fps( ){
        return this._fps || 0;
    }
    
    
    // fills the canvas with a color
    // @param {String} color
    fillAll( color ){ 
        this.context.fillStyle = color || "#fff";
        this.context.fillRect(0,0, this.obj.width,this.obj.height);
    }
    
    
    // shows a text at the given position with optional attributes
    // @param {Object} text, position, [maxWidth], [color], [size], [lineHeight], [fontFamily]
    showText({ text, pos, maxWidth, color, size, lineHeight, fontFamily }){
        
        this.context.fillStyle = color || "#000";
        this.context.font = ( size || "20" ) +"px "+ ( fontFamily || "Arial" );
        
        var line = '';
        var words = text.split(' ');
        var y = pos.y;
        var max = maxWidth ||( this.obj.width-pos.x );
        
        for( let n = 0; n < words.length; n++ ){
            let testLine  = line + words[n] + ' '; // line if word would be added
            let testWidth = this.context.measureText( testLine ).width; // width this line would take
            if( testWidth > max/*maxwidth*/ && n > 0){ // if this would be too big do print
                this.context.fillText( line, pos.x, y, max );
                line = words[n] + ' ';
                y += lineHeight || 30;
            } else {
                line = testLine; // else add this word
            }
        }
        this.context.fillText( line, pos.x, y, max );
        
    }
    
}



// global class CANVASNODE
class CanvasNode {
    
    // @param {Number}  x, y: position
    //        {Number}  z: z-index
    //        {Number}  width, height: boundings of the node
    //        {boolean} isVisible
    constructor( x,y,z, width,height, isVisible ){
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.width  = Math.abs( width || 1 );
        this.height = Math.abs( height|| 1 );
        this.isVisible = !! isVisible;
    }
    
    
    // @param {Object} x and y value of the new center
    set mid({ x,y }){
        this.x = ( x || this.x ) - Math.round( this.width  / 2 )
        this.y = ( y || this.y ) - Math.round( this.height / 2 )
        return this;
    }
    
    // @return {Object} x and y value of the center
    get mid( ){ return {
        x: this.x + Math.round(this.width /2),
        y: this.y + Math.round(this.height/2)
    }}
    
    
    toggleVisibility( ){ this.isVisible = !this.isVisible; }
    setVisible      ( ){ this.isVisible = true ; }
    setInvisible    ( ){ this.isVisible = false; }
    
    
    // abstract {boolean} update // gets called every frame
    // @param   {Number}  frames per second
    // @return  {boolean} if redrawing the node is necessary
    update( fps ){ return false; }
    // abstract {void} draw // gets called every frame if necessary // should draw the node
    draw( context ){}
    // abstract {void} onClick // event Handler for clicks and touches
    onClick( evt ){}
    // abstract {boolean} covers // checks if the node covers the given point
    covers({ x,y }){}
    
}



// global class CIRCLE extends CANVASNODE
class Circle extends CanvasNode {
    
    // @Override
    // @param {Number}  x, y: position
    //        {Number}  z: z-index
    //        {Number}  radius
    //        {boolean} isVisible
    //        {String} color / {Image} image
    constructor( x,y,z,r,isVisible,color_image ){
        super( x,y,z,r,r,isVisible );
        this.radius = r;
        if( color_image instanceof Image ){
            this.drawInfo = {color:false,img:true,value:color_image};
        } else if( color_image instanceof String || typeof color_image === "string" ){
            this.drawInfo = {color:true,img:false,value:color_image};
        } else {
            throw new TypeError("the last argument has to be an Image or String")
        }
    }
    
    
    // @Override
    // @param  {Object}  x and y value of the point
    // @return {boolean} true if the circle covers the given point
    covers({ x,y }){
        return Vector.initWithPoints( {x:this.x,y:this.y}, {x:x,y:y} ).distance <= this.radius;
    }
    
    
    // @param  {CanvasNode} node
    // @return {boolean} if this and node collide
    collision( node ){
        
        if( node instanceof Circle ){
            return Vector.initWithPoints( this.mid, node.mid ).distance <= this.radius + node.radius;
        } else if( node instanceof Rectangle ){
            return(
                node.covers ( 
                    this.mid 
                )||(
                    this.x >= node.x && this.x <= node.x + node.width  && // for top and bottom --> x value in rectangle
                    this.y + this.radius >= node.y                     && // lowest  point of the circle is below node.y
                    this.y - this.radius <= node.y + node.height          // highest point of the circle is above node.lowestY
                )||(
                    this.y >= node.y && this.y <= node.y + node.height && // for left and right --> y value in rectangle
                    this.x + this.radius >= node.x                     && // rightest point of the circle is right of node.x
                    this.x - this.radius <= node.x + node.width           // leftest  point of the circle is left of node.rightestX
                )||(
                    Vector.initWithPoints( this.mid, {x:node.x           , y:node.y            } ).distance <= this.radius || // upper  left
                    Vector.initWithPoints( this.mid, {x:node.x+node.width, y:node.y            } ).distance <= this.radius || // upper  right
                    Vector.initWithPoints( this.mid, {x:node.x           , y:node.y+node.height} ).distance <= this.radius || // bottom left
                    Vector.initWithPoints( this.mid, {x:node.x+node.width, y:node.y+node.height} ).distance <= this.radius    // bottom right
                )
            );
        } else {
            throw new TypeError( "node has to be an instance of a supported CanvasNodeExtension" );
        }
        
    }
    
    
    // @Override         
    // @param {Object} x and y value of the new center
    set mid({ x,y }){
        this.x = x;
        this.y = y;
    }
    
    // @Override
    // @return {Object} x and y value of the center
    get mid( ){return{
        x: this.x,
        y: this.y
    }}
    
    // @return {Object} x and y value of the upper left corner
    get upperLeftCorner( ){return{
        x: this.x - this.radius,
        y: this.y - this.radius
    }}
    
    // @param {Object} x and y value of the upper left corner
    set upperLeftCorner({ x,y }){
        this.x = x + this.radius;
        this.y = y + this.radius;
    }
           
    
    // @Override
    // @param {CanvasContext} context on which the Circle should be drawn on
    draw( context ){
        if( this.drawInfo.color ){
            context.fillStyle = this.drawInfo.value;
            context.beginPath( );
            context.arc( this.x, this.y, this.radius, 0, 2*Math.PI );
            context.fill( );
        } else {
            context.drawImage( this.drawInfo.value, this.x, this.y, this.radius, this.radius )
        }
    }
    
}



// global class RECTANGLE extends CANVASNODE
class Rectangle extends CanvasNode {
    
    // @Override
    // @param {Number}  x, y: position
    //        {Number}  z: z-index
    //        {Number}  width, height: boundings of the rectangle
    //        {boolean} isVisible
    //        {String} color / {Image} image
    constructor( x,y,z,width,height,isVisible,color_image ){
        super  ( x,y,z,width,height,isVisible );
        if( color_image instanceof Image ){
            this.drawInfo = {color:false,img:true,value:color_image};
        } else if( color_image instanceof String || typeof color_image === "string" ){
            this.drawInfo = {color:true,img:false,value:color_image};
        } else {
            throw new TypeError("the last argument has to be an Image or String")
        }
    }
    
    
    // @Override
    // @param {CanvasContext} context on which the Rectangle should be drawn on
    draw( context ){
        if( this.drawInfo.color ){
            context.fillStyle = this.drawInfo.value;
            context.fillRect( this.x, this.y, this.width, this.height );
        } else {
            context.drawImage( this.drawInfo.value, this.x, this.y, this.width, this.height )
        }
    }
    
    
    // @Override
    // @param  {Object}  x and y value of the point
    // @return {boolean} true if the rectangle covers the given point
    covers({ x,y }){return(
        x >= this.x &&
        y >= this.y &&
        x <= this.x + this.width &&
        y <= this.y + this.height
    );}
    
    
    // @param  {CanvasNode} node
    // @return {boolean} if this and node collide
    collision( node ){
        
        if( node instanceof Circle ){
            return(
                this.covers ( 
                    node.mid 
                )||(
                    node.x >= this.x && node.x <= this.x + this.width  && // for top and bottom --> x value in rectangle
                    node.y + node.radius >= this.y                     && // lowest  point of the circle is below this.y
                    node.y - node.radius <= this.y + this.height          // highest point of the circle is above this.lowestY
                )||(
                    node.y >= this.y && node.y <= this.y + this.height && // for left and right --> y value in rectangle
                    node.x + node.radius >= this.x                     && // rightest point of the circle is right of this.x
                    node.x - node.radius <= this.x + this.width           // leftest  point of the circle is left of this.rightestX
                )||(
                    Vector.initWithPoints( node.mid, {x:this.x           , y:this.y            } ).distance <= node.radius || // upper  left
                    Vector.initWithPoints( node.mid, {x:this.x+this.width, y:this.y            } ).distance <= node.radius || // upper  right
                    Vector.initWithPoints( node.mid, {x:this.x           , y:this.y+this.height} ).distance <= node.radius || // bottom left
                    Vector.initWithPoints( node.mid, {x:this.x+this.width, y:this.y+this.height} ).distance <= node.radius    // bottom right
                )
            );
        } else if( node instanceof Rectangle ){
            return(
                node.x <= this.x + this.width  &&
                node.x >= this.x - node.width  &&
                node.y <= this.y + this.height &&
                node.y >= this.y - node.height
            );
        } else {
            throw new TypeError( "node has to be an instance of a supported CanvasNodeExtension" );
        }
        
    }
    
}



// global class ROTATEDRECTANGLE extends CANVASNODE
class RotatedRectangle extends Rectangle {
    
    // @Override
    // @param {Number}  x, y: position
    //        {Number}  z: z-index
    //        {Number}  width, height: boundings of the rectangle
    //        {Number}  the angle in radians
    //        {boolean} isVisible
    //        {String} color / {Image} image
    constructor( x,y,z,width,height,isVisible,color_image ){
        super  ( x,y,z,width,height,isVisible,color_image );
        this.angle = 0;
        this.rotationPoint = {undef:true};
    }
    
    
    // @Override
    // @param {CanvasContext} context on which the Rectangle should be drawn on
    draw( context ){
        if( this.rotationPoint.undef ){
            super.draw( context );
        } else {
            context.translate( this.rotationPoint.x,this.rotationPoint.y );
            context.rotate( this.angle );
            if( this.drawInfo.color ){
                context.fillStyle = this.drawInfo.value;
                context.fillRect( this.x-this.rotationPoint.x,this.y-this.rotationPoint.y,this.width,this.height )
            } else {
                context.drawImage( this.drawInfo.value, this.x-this.rotationPoint.x,this.y-this.rotationPoint.y,this.width,this.height )
            }
            context.rotate( -this.angle )
            context.translate( -this.rotationPoint.x,-this.rotationPoint.y );
        }
    }
    
    
    // @param {Object} point (x and y position) of the rotation centre
    //        {Number} angle in radians
    rotate({ x,y }, angle){
        this.rotationPoint = {x:x||this.x+this.width/2,y:y||this.y+this.height/2};
        this.angle = angle||0;
    }
    
    
    // WARNING: NOT IMPLEMENTED
    // @Override
    // @param  {Object}  x and y value of the point
    // @return {boolean} true if the rectangle covers the given point
    covers({ x,y }){return(
        false//TODO
    );}
    
    
    // WARNING: NOT IMPLEMENTED
    // @param  {CanvasNode} node
    // @return {boolean} if this and node collide
    collision( node ){
        return false;//TODO
    }
    
}




// global class VECTOR
class Vector {
    
    // @param {Number} x and y value of the vector
    constructor({ x,y }) {
        this.x = x;
        this.y = y;
    }
    
    // @method initWithPoints, alternative constructor
    // @param  {Point}  p1, p2: Points with x and y coordinates
    // @return {Vector} the vector from p1 to p2
    static initWithPoints( p1,p2 ){
        return new Vector({
            x: p2.x - p1.x,
            y: p2.y - p1.y
        });
    }
    
    
    // @return {Number} magnitude of the vector
    get distance( ){
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    
    // @return {Number} angle of the vector in radians
    get angle( ){
        return Math.atan2(this.y,this.x);//TO_DEGREES: *180/Math.PI;
    }
    
    // @return {Vector} new Vector with same values
    get clone( ){
        return new Vector({ x:this.x,y:this.y });
    }
    
}
