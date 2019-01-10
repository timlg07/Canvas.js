class progressiveCircle extends Circle
{
    constructor
    ( 
        size        = 100, 
        position    = {x:50,y:50}, 
        durations   = {in:800,stay:1000,out:800}, 
        color       = "#000", 
        opacity     = .7 
    )
    {
        super( 
            position.x,
            position.y,
            1,    // z-index
            size,
            true, // is Visible
            color
        );
        
        this.time    = durations;
        this.opacity = {final:opacity,current:0};
    }
    
    // @Override
    update( fps )
    {
        let ms_per_frame = 1000 / fps;
        
        if( this.time.in > 0 )
        {
            this.opacity.current += (this.opacity.final-this.opacity.current) / (this.time.in/ms_per_frame)
            this.time.in -= ms_per_frame ;
            return true;
        }
        else if( this.time.stay > 0 )
        {
            this.time.stay -= ms_per_frame ;
            return false;
        }
        else if( this.time.out > 0 )
        {
            this.opacity.current -= this.opacity.current / (this.time.out/ms_per_frame)
            this.time.out -= ms_per_frame ;
            return true;
        }
        else
        {
            removeCircle( this );
        }
    }
    
    // @Override
    draw( context )
    {
        // because the opacity can be slightly negative in the last frame
        context.globalAlpha = Math.max( this.opacity.current,0 );
        super.draw( context );
    }
}