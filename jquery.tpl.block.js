/**@preserve jQuery.tpl block plugin v.0.0.2;Copyright 2010, Fedor Indutny;Released under MIT license **/
(function ($,undefined,data, length) {
	data = {};
	length= "length";
	
	function last(arr, key, val, readOnly, cache) {
	
		cache = arr[key];
		
		if (val) {
		
			if ( !arr[key] )
				return arr[key] = [val];
			
			return cache [ cache[length] ] = val;
		}
		
		if (!cache)
			return;

		val = cache [ 0 ];
			
		 (!readOnly)
			&& (cache[length] > 1)
				&& ( arr[key] = arr[key].slice(1) );
		
			
		return val;
	}
	
	function lastStack(gid, blocks ,readOnly) {
	
		var 
			  temp = blocks,
			  stack = data[gid].stack,
			  i,
			  len = stack[length]-(readOnly ? readOnly : 0);
		
		for ( i=0; i<len;i++)
			if (! (temp = last ( temp , stack[i] , undefined, readOnly)))
				return;
		
		return temp;	
	}
	
	function $extends($_,name, args, gid, junk, $this) {
	
		data[gid].ext = $.template(name);
		$this = this;		
		$_.join = function ($_) {
			
			$_ = [];						
			$this.$p(data[gid].ext($.extend(true, {$blockStack : data[gid].args}, args)), $_);
			
			init(gid);
			
			return Array.prototype.join.call($_, "");
		}		
		
	}
	
	function $block($args, $_, name, gid, code, args, temp) {
		temp = data[gid].stack;
						temp[temp[length]] = name;
				do {
		
			if (!data[gid].ext) {
				// If calling from extended template
				
				if (!$args.$blockStack || ( ! (args = lastStack(gid , $args.$blockStack) ) ) )  {
					$args.$p(code,$_);
					break;
				}
					
				$args.$p(args,$_);
				
				break;
			}
			
			// If calling from extending template
			last( ($_ = lastStack(gid, data[gid].args, 1)) , name, code );
		
		} while(undefined);
		
		temp[length]--;
	}
	
	function init(gid, namespace) {
		data [gid]= {
			/** @private */
			namespace : namespace || data[gid].namespace,
			/** @private */
			stack: [],
			/** @private */
			args: {}
		};
	}
	
	function align(namespace, junk) {
		if (data[namespace.$gid]) return namespace.$gid;
		
		init(namespace.$gid, namespace);
		
		$.extend(namespace,{
			$extends : $extends,
			$block : $block		});
		
		return namespace.$gid;
	}
	
	$.extend($.template.modificators,{
		"extends" : function (str , namespace) {
			str = str.split(" ");
			return [
				"$extends($_,",
				str[0],
				",",
				str[1],
				",",
				align(namespace),
				");"
			].join("");
			
		},
		"block" : function (name , namespace) {
			
			return "$block($args,$_," + name + "," +  align(namespace) + ",(function($_){";
			
		},
		"/block" : function (junk, namespace) {			
		
			return ";return $_.join('')})([]));";			
		}
	});
})(jQuery);