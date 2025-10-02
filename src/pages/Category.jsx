import { TiThSmallOutline } from "react-icons/ti";
import { MdOutlineFreeBreakfast } from "react-icons/md";
import { TbSoup } from "react-icons/tb";
import { CiBowlNoodles } from "react-icons/ci";
import { MdOutlineFoodBank } from "react-icons/md";
import { GiFullPizza } from "react-icons/gi";
import { GiHamburger } from "react-icons/gi";
 const Categories = [
{
    id:1,
    name:"All",
    icon:<TiThSmallOutline className="w-[20px] h-[20px] "/>,
},
{
    id:2,
    name:"breakfast",
    icon:<MdOutlineFreeBreakfast className="w-[20px] h-[20px] "/>,
},
{
    id:3,
    name:"soups",
    icon:<TbSoup className="w-[20px] h-[20px] "/>,
},
{
    id:4,
    name:"pasta",
    icon:<CiBowlNoodles className="w-[20px] h-[20px] "/>,
},
{
    id:5,
    name:"main_course",
    icon:<MdOutlineFoodBank className="w-[20px] h-[20px] "/>,
},
{
    id:6,
    name:"pizza",
    icon:<GiFullPizza className="w-[20px] h-[20px] "/>,
},
{
    id:7,
    name:"burger",
    icon:<GiHamburger className="w-[20px] h-[20px] "/>,
},
{
    id:8,
    name:"desserts",
    icon:<TiThSmallOutline className="w-[20px] h-[20px] "/>, } 

]

export default Categories